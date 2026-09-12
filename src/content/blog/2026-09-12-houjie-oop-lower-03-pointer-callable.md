---
title: "侯捷 C++ 指针式类与函数对象：让算法只依赖访问和调用"
date: 2026-09-12
type: 技术
tags: ["C++", "侯捷", "智能指针", "迭代器", "函数对象", "视频笔记", "vibe watching"]
summary: "从 shared_ptr 的 operator*、operator-> 到链表迭代器与 operator()，理解 pointer-like、function-like、仿函数及旧 unary_function/binary_function，补充所有权、const 与空类大小的边界。"
draft: false
---

[本门目录](/blog/2026-09-12-houjie-oop-lower-01-guide/) · [六门课程总目录](/blog/2026-09-12-houjie-cpp-roadmap/)

上一篇的 `Fraction` 说明，类可以控制自己怎样进入表达式。这两讲继续追问：一个对象能不能接受原本用于指针的 `*`、`->`，或原本用于函数的 `()`？

> **来源档案**：讲者侯捷；原课《C++程序設計 (II) 兼談對象模型》，画面带 Boolan 博览、云课堂标识。采用 DetachmentSy 于 2025 年上传的《侯捷 - C++面向对象高级开发（下）》，[BV1kBh5zrEWL](https://www.bilibili.com/video/BV1kBh5zrEWL/)。本文覆盖 P4《pointer-like classes》、P5《function-like classes》。原始录制年份未核实；核对日期 2026-09-12。以下据完整音轨转录及课件核对整理，现代补充与原创实验单独标明，属于 AI 辅助学习笔记。

先修是成员函数、引用、基本运算符重载，以及指针与所指对象的区别。读完应能把 `it->method()` 展开成实际访问过程，并解释算法怎样通过一个普通对象完成可替换的动作。

## 包装一根指针以后，调用者还想怎样使用它

P4 先展示一个简化的 `shared_ptr<T>`：对象内部保存 `T* px`，还露出一个计数相关成员，但课堂明确把焦点放在语法，并没有在这里展开共享所有权实现。

使用者拿 `new Foo` 的结果构造包装对象，接下来希望 `*sp` 得到 `Foo`，`sp->method()` 调用 `Foo` 的成员。于是这两个运算符承担不同职责：

```cpp
// 课堂接口的结构片段，省略构造、析构和所有权管理。
T& operator*() const { return *px; }
T* operator->() const { return px; }
```

`operator*` 返回对象的引用，调用者拿到的不是一份新复制品。如果改成返回 `T`，看起来仍然能够读值，却可能引入复制，修改也不再作用于原对象。返回类型在这里决定了访问契约。不过课件的 `Foo f(*sp);` 还包含下一步：用解引用得到的对象初始化另一个 `Foo`，该例会调用复制构造。返回引用避免的是解引用操作自身制造副本，不是禁止调用者随后复制。

**现代补充**：以上两行并不足以构成智能指针。它们没有回答谁负责删除对象、复制包装是否共享所有权、何时释放，也没有检查空指针。生产代码应当根据所有权选择标准组件；课堂出现的旧 `auto_ptr` 已从 C++17 标准库移除，属于历史背景，不能作为新代码的起点。[标准草案的兼容性变更记录](https://eel.is/c++draft/diff.cpp14.depr)同时列出了它与旧函数对象基类的移除。

这里“像指针”只描述接口。持有一个地址并重载 `->`，并不会自动延长所指对象的生命期；反过来，管理一个单独对象的所有权，也没有理由因此提供 `++`，因为那个对象未必是数组元素。

## 箭头为什么没有在第一次调用后消失

课程用很长一段解释一个常见困惑：`operator->()` 已经被调用，为什么返回 `px` 后还能接着执行 `px->method()`？

这不是设计者偷偷多写了一次操作，而是该运算符特有的语言规则。对类对象的成员访问，可以按下式理解：

```cpp
sp->method();
// 对该课堂返回 T* 的设计，可展开为：
sp.operator->()->method();
```

如果 `operator->()` 返回另一个具有此运算符的代理对象，规则还会继续应用，最终需要到达可进行内建成员访问的指针。课堂返回 `T*` 的写法很常见，却不是所有合法包装器唯一可能的写法。[C++ 工作草案的成员访问运算符规则](https://eel.is/c++draft/over.ref)给出了这个展开过程。

注意这和 `*sp` 不同：`operator*()` 返回什么，那个调用本身就得到什么；它没有类似箭头的自动继续作用规则。把两者都想成“取出里面的指针”，反而容易忽略它们返回值的差异。

## 换成链表迭代器，里面指向节点，外面访问元素

接下来课程将包装对象换成 `list` 的迭代器。用户眼里的容器是一个个 `T` 元素；实现里的节点还包含 `prev`、`next`。如果解引用返回整个节点，用户就不得不理解维护链表的内部结构。

因此课堂迭代器的 `operator*()` 从节点取出 `data`，返回元素引用；`operator->()` 再取得这个元素的地址。这里的变化很小，但非常关键：对外承诺保持“访问元素”，内部指针实际指向的是“容纳元素的节点”。

增量操作同样应按逻辑结构解释。链表迭代器的 `++` 沿 `next` 前进，不是对节点地址做固定字节数的算术。算法只要求“到达下一个元素”，容器实现负责兑现这个要求。这正好接上本站[组合、遍历与操作扩展](/blog/2026-09-12-cpp-design-patterns-08-structures/)中的迭代器讨论：遍历协议把用户与具体表示隔开。

**现代补充**：课堂广义地把迭代器称为智能指针，不能据此赋予它共享所有权。普通容器迭代器通常不拥有容器；对象销毁、元素删除或某些容器操作之后，原迭代器可能失效。不同迭代器类别允许的操作也不同，例如前向迭代器不要求 `--`，原生指针也可以充当迭代器，不要求所有迭代器都是类。[迭代器要求](https://eel.is/c++draft/iterator.requirements.general)同时约束语法、语义及可支持的操作。

## 让一个类接受括号，就能把动作作为对象传递

P5 转向 `operator()`。课堂用三个小类建立直觉：`identity` 返回收到的对象，`select1st` 取二元组的 `first`，`select2nd` 取 `second`。它们的工作不同，却都能用 `obj(argument)` 调用。

讲者还专门区分连续出现的两对括号：创建一个临时函数对象，再调用它，是两步。用较清楚的现代写法表达这层结构，就是 `SomeAction{}(argument)`：花括号构造对象，圆括号调用对象。一个类做成模板，只是让它接受更多类型；决定它能否像函数一样调用的是调用运算符。

课堂随后展示 `plus`、`minus`、`equal_to`、`less` 等函数对象，把原本写在表达式中的动作包装成可传递的对象。这里的价值是调用接口的一致性：算法不必把“做加法”“判断大小”的逻辑硬编码在遍历内部。

这些具体名字还要区分出处。P5 明确说明，当时展示的 `identity`、`select1st`、`select2nd` 来自特定实现扩展，不能假定换一个标准库就能找到同名组件。**现代补充**：C++20 有标准 `std::identity`，但不能把它与课件中那个固定 `const T&` 接口的历史模板直接画等号；现代版本使用转发语义。[标准 identity 定义](https://eel.is/c++draft/func.identity)

## 用一个能运行的实验把两讲接起来

下面是整理者原创的完整 C++20 示例，使用标准库，无第三方依赖。它没有复刻 `shared_ptr`，而是用两个栈上节点验证“元素访问协议 + 可调用动作”的组合；`Cursor` 不拥有节点。

```cpp
#include <algorithm>
#include <cassert>
#include <cstddef>
#include <iterator>
#include <memory>
#include <type_traits>

struct Item { int value; };
struct Node { Item data; Node* next; };
class Cursor {
    Node* node_ = nullptr;
public:
    using value_type = Item;
    using difference_type = std::ptrdiff_t;
    using iterator_category = std::forward_iterator_tag;
    using iterator_concept = std::forward_iterator_tag;
    Cursor() = default;
    explicit Cursor(Node* n) : node_(n) {}
    Item& operator*() const { return node_->data; }
    Item* operator->() const { return std::addressof(operator*()); }
    Cursor& operator++() { node_ = node_->next; return *this; }
    Cursor operator++(int) { auto old = *this; ++*this; return old; }
    friend bool operator==(Cursor, Cursor) = default;
};
static_assert(std::forward_iterator<Cursor>);
struct Total {
    int sum = 0;
    void operator()(const Item& item) { sum += item.value; }
};
int main() {
    Node second{{5}, nullptr};
    Node first{{3}, &second};
    const Cursor begin{&first};
    assert(begin->value == (*begin).value);
    assert(std::addressof(*begin) == &first.data);
    begin->value = 4; // const cursor, mutable element
    Total initial;
    auto result = std::for_each(begin, Cursor{}, initial);
    assert(initial.sum == 0); // algorithm received a copy
    assert(result.sum == 9);
    auto count = std::count_if(begin, Cursor{}, [](const Item& x) {
        return x.value > 4;
    });
    assert(count == 1);
    auto next = begin;
    assert((next++)->value == 4);
    assert(next->value == 5);
    ++next;
    assert(next == Cursor{}); // end may be compared, never dereferenced
}
```

这段程序已经用 Apple clang 21、`-std=c++20 -Wall -Wextra -pedantic-errors` 编译执行，断言通过。代码故意让 `Total` 保存状态：与课堂几个无状态小类对照，可以看到函数对象也能携带累计值，而不是只能模仿一条普通函数。

`std::for_each` 接收函数对象的值参数，并返回执行后的对象，所以 `initial.sum` 仍是零，结果在 `result.sum` 中。这个返回契约不能不加区分地推广到其他算法或并行重载。[for_each 的参数与返回规则](https://eel.is/c++draft/alg.foreach)

另一个容易误读的地方是 `const Cursor begin`。它限制游标本身被修改，却没有把所指元素变成 `const Item`，因此 `begin->value = 4` 仍成立。要提供只读元素访问，需要返回 `const Item&`/`const Item*` 的相应接口。`operator*() const` 的 `const` 修饰的是游标，不是引用目标。

`std::addressof` 是这里的现代补充，用于避免元素自己重载 `operator&` 时改变取地址行为。末尾空游标只代表本例约定的终点，可以比较，不能解引用；示例也没有提供删除节点、修改链表或多线程访问能力。这些边界不是加上两个运算符就会消失的。

## 那些只含 typedef 的基类，到底提供了什么

P5 最后揭开此前遮住的基类：旧函数对象常继承 `unary_function` 或 `binary_function`。课件显示它们不执行计算，只提供参数类型、结果类型等别名，并把为何继承的问题留到标准库课程。**整理者补充**：这些别名曾服务于要求读取 `argument_type` 等类型信息的旧适配器；这不是此处音轨已经展开的推导。[WG21 移除提案 N4190](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2014/n4190.htm)说明了这种历史用途。

**现代修正**：不需要为了使对象可调用而继承这些旧基类；`std::unary_function`、`std::binary_function` 已从 C++17 标准库移除，兼容性变化见上述标准记录。上面的 `Total` 没有任何基类，也能交给算法。应把历史的类型信息约定与“有 `operator()` 就能调用”分开。

课堂又用“没有数据，因此理论大小为零”解释这些空类。这个说法只能理解为没有有效载荷，不能成为 `sizeof` 结论。完整空类对象仍须具有非零大小，这不是某个编译器偶然受到的限制，也不是 C++20 才新增的要求；空基类子对象可以通过布局优化不额外占用空间，但是否、怎样重叠有语言和实现条件。`typedef` 不会为每个实例增加数据成员，却不意味着一个完整对象的大小可以直接记作零。[对象大小与可能重叠的子对象规则](https://eel.is/c++draft/intro.object)、[sizeof 的类型大小规则](https://eel.is/c++draft/expr.sizeof)

## 重点回看

以下时间来自本上传版本的转录，另以课件核对关键词。播放器若未按链接参数定位，可按表中时间手动回看；播放验证限制见本门导读。

| 讲次与时间 | 识别线索 | 回看时关注什么 |
| --- | --- | --- |
| [P4 · 01:34–02:49](https://www.bilibili.com/video/BV1kBh5zrEWL/?p=4&t=94) | 简化 `shared_ptr`、`px` | 本讲主动排除了哪些所有权实现细节 |
| [P4 · 06:57–11:29](https://www.bilibili.com/video/BV1kBh5zrEWL/?p=4&t=417) | `sp->method()` 展开 | `operator->` 返回后为什么还有一次成员访问 |
| [P4 · 16:26–19:54](https://www.bilibili.com/video/BV1kBh5zrEWL/?p=4&t=986) | `node.data`、`&operator*()` | 节点指针如何兑现元素访问接口 |
| [P5 · 02:50–06:11](https://www.bilibili.com/video/BV1kBh5zrEWL/?p=5&t=170) | `identity`、`select1st`、`pair` | 构造临时对象与调用对象是两步 |
| [P5 · 07:02–07:22](https://www.bilibili.com/video/BV1kBh5zrEWL/?p=5&t=422) | 三个示例的实现出处 | 讲者明确区分实现扩展与标准组件 |
| [P5 · 08:17–09:16](https://www.bilibili.com/video/BV1kBh5zrEWL/?p=5&t=497) | `plus`、`minus`、`equal_to`、`less` | 短页展示算术与比较怎样采用相同调用形式 |
| [P5 · 09:16–11:19](https://www.bilibili.com/video/BV1kBh5zrEWL/?p=5&t=556) | `unary_function`、`binary_function` | 类型别名的作用及空类大小的现代修正 |

## 思考与实验

1. 把 `Cursor::operator*()` 改成返回 `Item`，预测哪些断言、类型要求或取地址代码会失败，再编译。这个实验检验“引用到原元素”和“返回副本”的差别。
2. 把 `Total` 换成捕获一个外部整数引用的 lambda，运行同一遍历，比较累计结果保存在哪里。延伸问题：如果把这个 lambda 保存到外部变量生命期之后，为什么仅有可调用接口还不够？
3. 去掉 `Cursor` 的 `operator->()`，保留 `operator*()`，观察 `for_each` 是否仍能运行、哪些直接访问语句先报错。由此区分某个算法真正要求的能力与我们额外提供的便利接口。

上一篇：[转换函数、explicit 与代理引用](/blog/2026-09-12-houjie-oop-lower-02-conversions/)。若关心可替换行为的设计动机，可对照本站[策略与模板方法](/blog/2026-09-12-cpp-design-patterns-02-collaboration/)，比较编译期传入动作与运行期通过接口调用对象的关系。

下一篇：[模板入门与成员转换](/blog/2026-09-12-houjie-oop-lower-04-template-conversion/)。
