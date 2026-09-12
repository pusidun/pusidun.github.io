---
title: "侯捷 C++ auto 与引用：简写之后，值和对象仍要分清"
date: 2026-09-12
type: 技术
tags: ["C++", "侯捷", "auto", "引用", "重载", "视频笔记", "vibe watching"]
summary: "从 auto 迭代器与 range-based for 追到 reference、sizeof、地址和重载签名，区分值复制、引用绑定、顶层 const 与成员 const，并纠正 imag 值/引用重载的课堂误述。"
draft: false
---

[本门目录](/blog/2026-09-12-houjie-oop-lower-01-guide/) · [六门课程总目录](/blog/2026-09-12-houjie-cpp-roadmap/)

代码可以越来越短，但一句简写仍然需要决定：保存一份值，还是借用一个对象？P14 从 auto 和范围循环切入，P15 接着用引用的赋值、地址和函数接口把这件事展开。两讲适合连读，因为循环中一个很小的 `&`，正是后面对象语义的入口。

> **来源档案**：讲者侯捷；原课《C++程序設計 (II) 兼談對象模型》，带 Boolan 博览及云课堂标识。本文采用 DetachmentSy 于 2025 年上传的《侯捷 - C++面向对象高级开发（下）》，[BV1kBh5zrEWL](https://www.bilibili.com/video/BV1kBh5zrEWL/)，覆盖 P14《三个主题》的 auto、range-based for 部分（约09:51起）及 P15《Reference》。P14 前段可变参数模板归入本门模板篇。原录制年份未核实，核对日期2026-09-12。已读完整音轨转录并核对课件；本文为 AI 辅助初加工，现代修正与原创实验单独说明。

先修是变量初始化、指针、容器迭代器和简单函数重载。可先阅读[类型转换与代理](/blog/2026-09-12-houjie-oop-lower-02-conversions/)及[指针式类与函数对象](/blog/2026-09-12-houjie-oop-lower-03-pointer-callable/)，特别留意代理对象与独立数值的区别。

## auto 省去类型拼写，没有省去类型判断

P14 用 `list<string>` 的查找操作介绍 `auto`。旧写法先声明一个很长的迭代器类型，再赋给它 `find` 的返回结果；新写法把声明和初始化合在一起，由右侧表达式推导左侧类型。两者的目标仍是同一种迭代器。

课堂特意把 `auto ite;` 单独声明、下一行再赋值的版本划掉。局部变量在这里需要初始化表达式提供推导依据，编译器不会等到后面的赋值才选择类型。类型在编译期确定，后面赋另一个类型的值也不会把这个变量变成另一种类型。[auto 占位类型推导规则](https://eel.is/c++draft/dcl.spec.auto)

`auto` 的价值也不限于少写几个字符。课堂提到 lambda 的闭包类型不能直接按普通类名写出，`auto` 能保存这类表达式的结果。因此“只是语法糖”可以作为入门直觉，却不能据此假定任何地方都能机械替换成一个容易写出的类型名。

**整理者补充**：知道初始化表达式的类型，还要知道声明是否保留引用和 `const`。对普通 `int` 对象的引用使用 `auto copy = ref;` 会得到独立整数；写 `auto& alias = ref;` 才保留对原对象的引用。如果源对象是 `const int`，普通 `auto` 值声明得到 `int`，而 `auto&` 会推导为 `const int&`，不能借它修改原对象。声明中的 `&` 和初始化表达式共同决定结果。[占位类型推导](https://eel.is/c++draft/dcl.type.auto.deduct)、[推导中的引用与顶层 const](https://eel.is/c++draft/temp.deduct.call)

前文 `vector<bool>` 的代理提供了另一种提醒：`auto` 从代理表达式推导出代理类，复制代理仍可能关联原存储。因此“auto 值声明”也不能一概解释为“与源对象毫无关系的快照”。需要什么语义，应从表达式与所推导类型一起判断。

## 范围 for 中的那个变量，代表的是值还是元素

课程接着把同一个问题放进循环。对 `vector<double>` 使用 `for (auto elem : vec)`，每轮用一个元素的值初始化局部 `elem`；打印没有问题，但将 `elem` 乘以三只改变副本。改成 `for (auto& elem : vec)`，局部名字直接引用元素，乘法才会更新原容器。

课程图里使用 pass by value、pass by reference 解释区别。严格地说，这里是循环变量的初始化，不是一次函数传参；二者共同的教学重点，是分清复制和别名。

**现代补充**：范围 `for` 也能遍历数组和提供合适 `begin/end` 的自定义范围，不限于标准容器。花括号列表可以在这种语境形成初始化列表，并不等于随便一种可以增删元素的容器。遍历过程还持有迭代位置，不能因为没有显式写出迭代器，就忽略循环体修改容器可能导致的失效。[范围 for 的展开规则](https://eel.is/c++draft/stmt.ranged)

对只读的大对象，`const auto&` 可以避免每轮复制，并表达只读访问；需要修改元素时用合适的引用；对小整数等廉价类型，按值往往就很自然。应先选择语义，再考虑经过测量的成本，不能把“引用总比值快”作为所有类型的规则。

## 引用赋值不会重新选择被引用对象

P15 从 `int x = 0; int* p = &x; int& r = x;` 开始。指针 `p` 保存指向 `x` 的值；表达式 `*p` 才访问那个整数。引用 `r` 则直接作为 `x` 的另一个名字使用，读取 `r` 就是在读取 `x`。

接着引入 `int x2 = 5`，执行 `r = x2`。课堂刻意设置这个容易误解的转折：这一行没有让 `r` 改为引用 `x2`，它仍然引用 `x`，只是把 `x2` 的值赋给了 `x`。随后 `int& r2 = r` 也引用同一个整数，不是另造一层可以任意重新接线的引用对象。

对这里的局部引用声明，必须在初始化时建立绑定；引用一旦绑定，就不能通过赋值改绑。如果确实需要一个可选择、可重新指向别处的句柄，指针或具有相应契约的包装类型更符合需求。要表达“不存在”时也应显式建模，不能通过解引用空指针“制造一个空引用”。

## sizeof 和取地址看到的是被引用对象

课程从整数例子换到 `double`，再换到包含四个整数的结构体，打印大小和地址。每一次 `sizeof(r)` 都和被引用对象相同，`&r` 也得到该对象的地址。这些观察揭示的是引用表达式的规则，不是在测量某个隐藏指针字段。

**必须保留的修正**：课件把上述行为称为编译器制造的“假象”，并将引用一律画成四字节的隐藏指针。更准确的分层是：语言定义 `sizeof` 作用于引用时取得被引用类型的大小，对引用表达式使用内建取地址运算，取得所指对象的地址；标准没有指定引用本身是否需要存储。编译器可能按 ABI 传递地址，也可能直接消除局部引用。不能根据 `sizeof(r)` 宣称已观察到引用的存储大小，更不能把课堂 32 位环境的数字搬到所有平台。[引用声明规则](https://eel.is/c++draft/dcl.ref)、[sizeof 规则](https://eel.is/c++draft/expr.sizeof)

下面是整理者原创的完整 C++20 实验，把查找、循环变量和引用赋值放在一起。它只对语言保证的关系作断言，不硬编码指针或 `int` 的字节数。

```cpp
#include <algorithm>
#include <cassert>
#include <list>
#include <string>
#include <type_traits>
#include <vector>

int main() {
    std::list<std::string> words{"red", "blue"};
    auto found = std::find(words.begin(), words.end(), "blue");
    static_assert(std::is_same_v<decltype(found),
                  std::list<std::string>::iterator>);
    assert(found != words.end() && *found == "blue");

    std::vector<double> values{1.0, 2.0};
    for (auto value : values) { value *= 3; (void)value; }
    assert((values == std::vector<double>{1.0, 2.0}));
    for (auto& value : values) value *= 3;
    assert((values == std::vector<double>{3.0, 6.0}));

    int x = 1;
    int& ref = x;
    auto copy = ref;
    auto& alias = ref;
    static_assert(std::is_same_v<decltype(copy), int>);
    static_assert(std::is_same_v<decltype(alias), int&>);
    copy = 9;
    assert(x == 1);
    alias = 7;
    assert(x == 7 && copy == 9);
    int other = 4;
    ref = other;
    assert(x == 4 && &ref == &x && &other != &ref);
    assert(sizeof(ref) == sizeof(x));
}
```

本例已在 Apple clang 21 下以 `-std=c++20 -Wall -Wextra -pedantic-errors` 编译运行。它还在解引用查找结果之前检查了 `end()`，因为推导出迭代器类型并不保证查找成功。

## 传参的简洁外观，仍然需要明确修改与生命期

课堂接着比较三种函数：接收 `Cls*` 后使用 `pobj->xxx()`，接收 `Cls` 后使用 `obj.xxx()`，接收 `Cls&` 也使用 `obj.xxx()`。调用后两者时同样可以写 `func(obj)`，但前者处理值参数，后者直接访问调用方对象。相同调用外观不代表相同效果。

对于会复制大量数据的类型，引用常能避免一次不必要的复制；对需要修改原对象的操作，非 const 引用能够直接表达这一关系。**现代补充**：只读借用可以考虑 `const T&`，小而廉价的类型通常按值就很合理。引用也可能引入间接访问或别名约束，性能仍由类型、ABI、优化和实际调用决定，不存在“引用始终更快”的语言保证。

返回引用同样是在提供借用。被引用对象必须在调用者使用期间仍然存在；返回普通局部自动变量的引用，并不会让该变量在函数结束后继续存活。[对象生命期规则](https://eel.is/c++draft/basic.life) RAII 能按时销毁所有者，却不能自动使外部保存的引用继续有效。这个问题可以对照本站[对象唯一性、共享与历史快照](/blog/2026-09-12-cpp-design-patterns-06-lifetime/)的所有权讨论：知道谁销毁对象以后，还要知道谁持有借用。

本课主要解释左值引用，不能把“绑定后不能改绑”推导为引用拥有资源，也不能将它直接等同于其他语言的对象引用。更完整的右值引用、转发和生命周期延长规则属于新标准课程的深化内容。

## 两个重载可以并存，不代表普通调用能选出一个

P15 末尾的课件把以下两种形式标成 same signature：

```cpp
// 课堂讨论的声明形状。
double imag(const double& im);
double imag(const double im);
```

**这里需要修正课堂结论**：这两个函数可以作为重载共同声明、定义，参数类型分别为 `const double&` 和 `double`；值参数的顶层 `const` 不构成函数类型差异，但引用与值仍有差异。问题出在普通的 `imag(x)` 调用：对一个 `double x`，两者都提供同等级的匹配，没有唯一最佳候选，所以调用二义。它不是在声明第二个函数时就发生了签名冲突。[函数参数类型调整规则](https://eel.is/c++draft/dcl.fct)、[最佳可行函数选择](https://eel.is/c++draft/over.match.best.general)

这和前文 `Fraction` 中区分“加法表达式”与“结果初始化”是同一种核查方法：先找出编译失败的具体阶段，再解释为什么失败。

下面的原创 C++20 实验让两个函数正常并存，通过明确的函数指针类型选出各自版本；它还验证了课末正确的另一条结论：普通成员函数末尾的 `const` 可以区分重载。

```cpp
#include <cassert>

double imag(const double value) { return value; }
double imag(const double& value) { return -value; }
struct Box {
    int value = 3;
    int& get() { return value; }
    const int& get() const { return value; }
};
int main() {
    double x = 2.0;
    auto by_value = static_cast<double(*)(double)>(&imag);
    auto by_reference = static_cast<double(*)(const double&)>(&imag);
    assert(by_value(x) == 2.0);
    assert(by_reference(x) == -2.0);
    // imag(x); // error: ambiguous call, not a conflicting declaration
    Box box;
    box.get() = 7;
    const Box& readonly = box;
    assert(readonly.get() == 7);
}
```

该完整例子编译运行通过。另将注释中的 `imag(x)` 放进独立负例，编译器报告 `call to 'imag' is ambiguous`，并列出两个候选，验证了错误确实发生在调用处。

这里还要辨认 `const` 出现的位置：值参数的顶层 `const`、所引用对象的 `const`、成员函数末尾的 `const`，不是同一项规则。`Box::get()` 与 `Box::get() const` 根据所调用对象是否可变提供不同访问接口；不要将这一例概括成“任意位置增加 const 都能形成新重载”。

## 重点回看

| 讲次与时间 | 识别线索 | 值得回看的原因 |
| --- | --- | --- |
| [P14 · 10:07–13:34](https://www.bilibili.com/video/BV1kBh5zrEWL/?p=14&t=607) | `auto ite = find(...)`、被划掉的 `auto ite;` | 推导依据来自初始化，后续赋值不能补救 |
| [P14 · 18:50–21:44](https://www.bilibili.com/video/BV1kBh5zrEWL/?p=14&t=1130) | `auto elem` 与 `auto& elem`、乘以三 | 观察副本与原元素的不同变化 |
| [P15 · 06:04–08:34](https://www.bilibili.com/video/BV1kBh5zrEWL/?p=15&t=364) | `r = x2`、`int& r2 = r` | 赋值不会重新绑定引用 |
| [P15 · 10:50–13:44](https://www.bilibili.com/video/BV1kBh5zrEWL/?p=15&t=650) | double、结构体 S、大小与地址 | 将课堂实现图与语言表达式规则分开 |
| [P15 · 14:51–18:14](https://www.bilibili.com/video/BV1kBh5zrEWL/?p=15&t=891) | `func1/func2/func3` | 同样的调用外观怎样对应不同传参契约 |
| [P15 · 18:16–21:36](https://www.bilibili.com/video/BV1kBh5zrEWL/?p=15&t=1096) | `imag`、same signature、Ambiguity | 对照文章负例，精确纠正签名与调用二义的区别 |
| [P15 · 21:42–23:25](https://www.bilibili.com/video/BV1kBh5zrEWL/?p=15&t=1302) | 末尾 `const` 的问答 | 判断 const 修饰的位置，而不是只看关键字有无 |

本文时间来自同一分 P 的完整音轨，课件抽样核对主题；自动转录少数零时长提示词保留原文及单独记录，不用于制造时间区间。播放器若不自动跳转，可按可见时间手动定位。

## 思考与实验

1. 将第一个实验的 `auto& alias = ref` 改成 `const auto& alias = ref`，先预测哪一行编译失败。再通过 `x` 修改对象，观察只读引用能否读到新值，解释“不能经它修改”与“对象永不变化”的区别。
2. 将查找目标改为不存在的字符串，保留末尾检查并修改断言，验证找不到的路径。若直接解引用结果，缺少的不是类型信息，而是什么运行前提？
3. 对比 `void f(double)` 与 `void f(const double)`，以及本文的值/引用重载。分别写两个定义，比较“重定义”和“调用二义”的诊断；不要只凭两段源码看上去相似就归为同一种错误。
4. 设计一个返回引用的查询函数，写明被引用对象归谁所有，以及哪项操作会使返回值失效。扩展到容器时，查阅该容器的具体失效规则，不通过运行悬空引用来验证。
