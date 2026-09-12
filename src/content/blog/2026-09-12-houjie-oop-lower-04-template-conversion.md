---
title: "侯捷 C++ 模板入门：从类型参数到成员转换的边界"
date: 2026-09-12
type: 技术
tags: ["C++", "侯捷", "模板", "成员模板", "视频笔记", "vibe watching"]
summary: "用 namespace、complex、min、pair 与 shared_ptr 串起类模板、函数模板实参推导、成员模板和向上转换，区分复制构造、对象切片与受约束的跨类型初始化。"
draft: false
---

[本门目录](/blog/2026-09-12-houjie-oop-lower-01-guide/) · [六门课程总目录](/blog/2026-09-12-houjie-cpp-roadmap/)

> **来源档案**：讲者侯捷；原课《C++程序設計 (II) 兼談對象模型》，画面带 Boolan 博览、云课堂标识。采用 DetachmentSy 于 2025 年上传的《侯捷 - C++面向对象高级开发（下）》，[BV1kBh5zrEWL](https://www.bilibili.com/video/BV1kBh5zrEWL/)。本文覆盖 P6《namespace经验谈》、P7《class template》、P8《Funtion Template》（上传目录原拼写）、P9《Member Template》。原始录制年份未核实；核对日期 2026-09-12。依据完整音轨转录与关键课件整理，现代补充和原创实验单列，属于 AI 辅助学习笔记。

上篇让对象能够像指针一样访问、像函数一样调用。这一篇再问：这些类和算法怎样适用于不同类型，而不必为每个类型复制一套实现？先修是类、构造函数、引用、运算符重载与公开继承；读完应能区分类型参数由谁决定，以及一次跨类型构造最终在哪里接受检查。

## 先给实验命名，再让类型可变

P6 的命名空间小节很短，但它解释了课程后面大量实验的组织方式。讲者不想为了测试几十件事维护几十个程序，于是在一个 `main` 里分别调用 `jj01::test_member_template()`、`jj02::test_template_template_param()` 等入口。每组实验可以都使用 `Foo` 或 `X` 作为类名，只要放在各自的命名空间内，就不会因为这个简单名字相同而冲突。

这是一种值得带走的学习方法：比较两个语言机制时，让实验互不干扰，保留能独立运行的入口。命名空间控制名称的归属，并不自动隔离共享资源或建立模块边界；把代码放进去也不会消除跨组调用。课堂的“彼此没有牵连”应当按避免名字冲突来理解。

P7 随后从上一阶段用过的复数类开始。实部与虚部原先由设计者选定数值类型，现在希望使用者可以选 `double` 或 `int`。变更的第一步不是复制一份类，而是把这些位置统一替换成 `T`，在类前声明 `template<typename T>`。使用者再写 `complex<double>` 或 `complex<int>`，让同一结构分别承载不同数值类型。

这里要保留两个层次：`complex` 是模板，`complex<double>` 是指定实参后得到的类类型。每个类型所需的操作也必须有意义；只把类型名字换成 `T`，并不证明任何类型都适合充当复数分量。课堂以数值类型帮助建立直觉，生产数学代码还要定义精度、溢出和运算封闭性。

## 推导出类型后，还要兑现操作要求

P8 把同样的抽取动作应用到函数：比较 `a`、`b`，返回较小者。如果过程只需要 `<`，就可以让参数类型成为 `T`。调用 `min(r1, r2)` 时，编译器可以从实参推导出 `T`，接着检查这个类型是否支持函数体中的操作。

课堂的 `stone` 有宽、高、重量三个成员，但它的 `operator<` 只比较重量。这一步把通用算法与领域判断接起来：`min` 不必知道石头有什么属性，石头类型负责定义自己的“小于”。若类型根本没提供这个操作，模板定义看起来可以成立，实际使用时仍会失败。讲者用“半成品”描述这一点，意在强调定义阶段与使用阶段的检查不同，不意味着所有模板错误都会推迟到实例化才发现。

这里还藏着一个设计选择。按重量排序是否真是石头唯一自然顺序？如果调用场景有时按高度、有时按重量，上篇的函数对象就能把比较策略从类型本身抽出来。让算法接受比较器，往往比强行规定全局的 `operator<` 更清楚。

**现代补充**：课堂把类模板显式写类型与函数模板自动推导对照，是建立初步直觉。C++17 已有类模板实参推导（CTAD）；函数模板也并非任何参数都能推导，例如只出现在返回类型的模板参数通常无法从普通调用实参确定。是否省略尖括号，应看实际声明和推导规则。[类模板实参推导规则](https://eel.is/c++draft/over.match.class.deduct)

## 类的类型确定以后，构造来源还可以变化

P9 的 `pair` 把两个值放在一起。外层模板参数 `T1`、`T2` 决定成员 `first`、`second` 的类型；假如只有接收同一种 `pair` 的构造函数，那么目标类型一确定，来源类型也被一并锁死了。

课程增加第二层模板参数：

```cpp
// 课堂结构片段，省略其余构造函数与现代约束。
template<class T1, class T2>
struct Pair {
    T1 first;
    T2 second;
    template<class U1, class U2>
    Pair(const Pair<U1, U2>& p) : first(p.first), second(p.second) {}
};
```

外层回答“我要存什么”，内层回答“我允许从什么来源构造”。成员模板的独立参数让来源不必与目标完全同型，但最后仍要通过 `first(p.first)` 和 `second(p.second)` 的初始化检查。这两项是成员初始化，不是先构造后赋值。

课堂用两条继承关系解释方向：鲫鱼属于鱼类，麻雀属于鸟类。因此一对鲫鱼、麻雀可以用来构造一对鱼类、鸟类；反方向不会凭空获得具体派生类型的内容。接着换成鲸的反例：名字带“鱼”不构成 C++ 继承关系，模型里没有合适转换，成员初始化就不能通过。讲者又问鸟是否一定会飞，提示读者把自然语言分类与接口所承诺的能力区分开。

**整理补充**：`Pair<Derived1, Derived2>` 与 `Pair<Base1, Base2>` 本身并没有因此成为派生类与基类。它们是两个不同的类类型，是转换构造函数逐成员建立了联系。如果成员按值存储，派生对象转换到基类值还会丢失派生部分，也就是对象切片；这不适合保存运行期多态对象。

课堂图里还有 `p2(pair<Derived1,Derived2>())` 这种括号形式。实际书写声明时，它可能落入“最令人困惑的解析”，被理解成函数声明；实验应改用 `Pair<Base1, Base2> p2{source};` 等无歧义形式，不能仅凭示意图把那行当成已经构造对象的保证。

## 智能指针为什么也需要成员模板

同一讲的第二个案例接回[指针式类与函数对象](/blog/2026-09-12-houjie-oop-lower-03-pointer-callable/)。原生指针可以让 `Base*` 指向具有公开、无歧义基类关系的 `Derived` 对象。若一个包装类想保留这种能力，它的构造接口就不能只接受完全相同类型的地址。

课件的历史 `shared_ptr` 实现片段把目标元素类型放在类模板参数中，又给接收原生指针的构造函数另设一个类型参数。于是 `shared_ptr<Base1> sptr(new Derived1)` 能检查真实来源类型，再完成内部初始化。这里展示的是库设计如何兑现向上转换能力，不能只靠名字叫智能指针就假定转换自然存在。

**现代补充**：成员模板不限于类模板内，普通类也可以有成员模板；成员函数模板不能声明为 `virtual`，其特化也不会覆盖基类虚函数。[成员模板规则](https://eel.is/c++draft/temp.mem)

另一个重要区别是，接收其他特化的构造模板不是语言规定的复制构造函数。真正的复制构造函数是满足相应签名规则的非模板构造函数；写了构造模板不会自动取消隐式复制构造。下面明确把同型复制写成 `= default`，把异型转换写成受约束的模板，便于分辨职责。[复制构造函数规则](https://eel.is/c++draft/class.copy.ctor)

## 用独立实验验证转换方向

下面是整理者原创完整 C++20 程序，无第三方依赖。它用 P6 的命名空间方式隔离比较实验与转换实验；`Observer` 是不拥有对象的观察指针，专门验证转换约束，标准 `shared_ptr` 则验证真实共享所有权。

```cpp
#include <cassert>
#include <concepts>
#include <memory>
#include <type_traits>
namespace comparison {
struct Stone { int weight; };
template<class T, class Less>
T min_value(T a, T b, Less less) { return less(b, a) ? b : a; }
void test() {
    auto s = min_value(Stone{8}, Stone{3}, [](Stone a, Stone b) {
        return a.weight < b.weight;
    });
    assert(s.weight == 3);
}
}
namespace conversion {
struct Base { int value = 7; virtual ~Base() = default; };
struct Derived : Base {};
template<class T> class Observer {
    T* ptr_;
public:
    explicit Observer(T* p) : ptr_(p) {}
    Observer(const Observer&) = default;
    template<class U> requires std::convertible_to<U*, T*>
    Observer(const Observer<U>& other) : ptr_(other.get()) {}
    T* get() const { return ptr_; }
};
static_assert(std::is_constructible_v<Observer<Base>, Observer<Derived>>);
static_assert(!std::is_constructible_v<Observer<Derived>, Observer<Base>>);
void test() {
    Derived object;
    Observer<Derived> d{&object};
    Observer<Base> b = d;
    Observer<Base> copy = b;
    assert(b.get() == &object && copy.get() == b.get());
    auto owned = std::make_shared<Derived>();
    std::shared_ptr<Base> base = owned;
    assert(base.get() == owned.get() && base.use_count() == 2);
}
}
int main() { comparison::test(); conversion::test(); }
```

代码已用 Apple clang 21、`-std=c++20 -Wall -Wextra -pedantic-errors` 编译运行，所有断言通过。`std::convertible_to<U*, T*>` 将“来源指针确实能隐式转换到目标指针”写进接口，反方向的 `is_constructible` 在编译期得到 `false`。这个条件也自然排除不能完成此转换的私有继承或有歧义继承，不应把课堂的“向上转换一定合理”理解成没有前提。

`Observer` 不延长对象生命期，也不承担删除工作；本例中 `object` 始终活到所有观察者使用结束。`shared_ptr` 两个变量则共享同一拥有关系，这不是重新用 `owned.get()` 构造一个独立控制块。后者可能导致重复释放，不能拿来模仿本例。

比较实验刻意返回值，使结果不依赖实参继续存活；课堂 `min` 返回 `const T&` 可以避免复制，却要确保被返回的对象仍然存在。这里的 `Stone` 是小值类型，若换成昂贵或不可复制对象，就应重新选择参数与返回策略，而不是一律照搬。

## 重点回看

| 讲次与时间 | 识别线索 | 回看时关注什么 |
| --- | --- | --- |
| [P6 · 01:48–03:37](https://www.bilibili.com/video/BV1kBh5zrEWL/?p=6&t=108) | `jj01`、`jj02`、一个 `main` | 如何隔离实验名称并保留统一入口 |
| [P7 · 00:42–01:47](https://www.bilibili.com/video/BV1kBh5zrEWL/?p=7&t=42) | `complex<T>` 的 `re`、`im` | 哪些类型位置一起成为变化点 |
| [P8 · 01:15–02:30](https://www.bilibili.com/video/BV1kBh5zrEWL/?p=8&t=75) | `argument deduction`、`stone::_weight` | 推导类型之后还要找到比较操作 |
| [P9 · 02:23–06:38](https://www.bilibili.com/video/BV1kBh5zrEWL/?p=9&t=143) | 鲫鱼/鱼类、麻雀/鸟类、`first(p.first)` | 外层目标类型和内层来源类型分别变化 |
| [P9 · 07:25–08:30](https://www.bilibili.com/video/BV1kBh5zrEWL/?p=9&t=445) | 鲸与鱼、鸟与飞行 | 分类名称怎样暴露继承建模前提 |
| [P9 · 08:52–12:02](https://www.bilibili.com/video/BV1kBh5zrEWL/?p=9&t=532) | `shared_ptr<Base1>(new Derived1)` | 包装类如何兑现原生指针的转换能力 |

## 思考与实验

1. 给 `Stone` 增加高度，用两个不同比较器分别取最轻与最矮的石头。让两个答案不同，验证“类型相同”并不意味着比较策略相同。
2. 将 `Observer` 的转换约束去掉，再比较 `std::is_constructible_v` 与真正调用错误方向构造时的编译结果。提示：接口可被选中，不代表函数体里的操作能够成功；用两个独立测试文件避免一个失败遮住另一个结果。
3. 给派生类添加额外数据，分别存入基类值、基类指针和 `shared_ptr<Base>`。用成员访问与虚函数调用的小实验区分切片、观察与拥有，不要仅凭“能够初始化”判定三者等价。

上一篇：[指针式类与函数对象](/blog/2026-09-12-houjie-oop-lower-03-pointer-callable/)。继承模型中的行为前提，可对照本站[继承、多态与替换契约](/blog/2026-09-12-cpp-design-patterns-01-foundations/)；本门后续继续讨论如何为特殊类型定制模板，以及如何把容器模板本身作为参数。
