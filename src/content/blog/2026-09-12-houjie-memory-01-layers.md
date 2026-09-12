---
title: "侯捷 C++ 内存管理（一）：从容器到 malloc，先分清谁在管理什么"
date: 2026-09-12
type: 技术
tags: ["C++", "侯捷", "内存管理", "视频笔记", "vibe watching"]
summary: "从侯捷内存管理课程的层次图出发，区分 new 表达式、operator new、malloc/free、allocator 与操作系统接口；用 allocator_traits 实验理解存储分配、对象构造、异常清理及数量匹配，并厘清旧 GNU alloc 与 __pool_alloc 的版本边界。"
draft: false
---

[侯捷 C++ 六门课程总目录](/blog/2026-09-12-houjie-cpp-roadmap/)

程序里没有写 `malloc`，并不意味着没有动态内存分配。向容器加入元素时，容器可能请求新的存储；反过来，自己再包一层“内存管理器”，也不一定解决了库尚未解决的问题。

侯捷在开场提出的学习目标很实际：看清已有管理器的动作，才能判断应用还需要做什么。理解底层，不等于每个业务程序都要重新实现它。

> **来源档案**
>
> 讲者：**侯捷**。标题页原课名为**《内存管理：从平地到万丈高楼》**，英文副题 **Memory Management 101**；课程画面带 Boolan 博览、云课堂标识。
>
> 本系列依据 B 站账号 **DetachmentSy** 上传的**《侯捷 - C++内存管理机制》**，标识 **BV1d3h5zFEjL**，当前 60 个分 P。平台发布年份为 **2025 年**，原始录制年份与原课是否完整未核实；上传者与讲者不是同一署名角色。核对日期：2026-09-12。
>
> 本篇对应 P1《Overview》、P2《内存分配的每一层面》、P3《四个层面的基本用法》。依据这三 P 的完整音轨转录和关键课件核对整理，是 AI 辅助初加工的学习笔记；现代示例与修正单独说明。[本次回放](https://www.bilibili.com/video/BV1d3h5zFEjL/)。

## 先修、导读与本门目录

先需要用过动态分配，也用过 `vector`、`list` 等标准容器。暂时不需要自己写过内存池。读完本篇，应能回答三个问题：调用入口属于哪一层，分配参数的单位是什么，以及取得存储后对象是否已经存在。

本篇是本门课程的阅读入口。后续内容将沿着语言构件、类专用池、SGI 分配器、VC6 小块堆、Loki 与 GNU 扩展展开；这些方向来自上传目录，具体文章会在对应音轨与代码核对完成后加入目录。

- 本篇：分配层次、四种入口与数量契约（P1–3）。

## 层次图解释的是责任，不是一条不可改变的调用链

P2 的课件从上到下画出应用、C++ 标准库、语言基本构件、CRT 和操作系统接口。最上面的应用可以选择不同入口；容器则通常把存储需求交给分配器。

| 入口 | 调用者主要表达什么 | 还需要关心什么 |
| --- | --- | --- |
| 容器，如 `std::vector<T>` | 保存、访问和组织元素 | 容量、失效规则、对象成本和资源寿命 |
| `new T(args)` / `delete p` | 创建或销毁一个动态对象 | 所有权、匹配释放与异常 |
| `::operator new(bytes)` | 请求原始存储 | 大小、对齐、对象初始化和配对释放 |
| `malloc(bytes)` / `free(p)` | C 库层面的存储请求与归还 | 分配失败、大小及使用契约 |
| 平台内存 API | 指定平台的内存资源操作 | 平台语义、页与区域、可移植性 |

这里的 CRT 是 C Runtime Library，即 C 运行库。课件的操作系统层列出 Windows 的 `HeapAlloc`、`VirtualAlloc`，用于说明下层入口。

课堂说许多上层动作最后落到 `malloc`，紧接着也指出直接调用操作系统接口可以绕过它。应把这幅图当作所分析实现的导航：C++ 标准没有规定 `operator new` 必须用 `malloc`，也没有要求任意容器增长都执行一次系统调用。分配器可能缓存、复用，甚至使用预先提供的存储。[C++ 标准草案：new 表达式](https://eel.is/c++draft/expr.new)

这也是课程从基本构件开始、再深入复杂管理器的原因。先知道从哪里进入，后面看空闲链表、批量申请和回收策略才不会迷路。

## 同样叫“分配”，参数却未必是同一个单位

P3 把四种入口逐一使用。`malloc(512)` 和直接调用 `::operator new(512)` 都以字节数表达请求；`new complex<int>` 则写出对象类型，由语言处理所需存储与初始化。

接着，课堂绕过容器，直接使用 `allocator<int>`。`allocate(5)` 的含义是为五个 `int` 提供存储，不是五个字节。对应的 `deallocate(p, 5)` 还要带回分配数量。

这让人觉得不如 `free(p)` 方便：为什么归还时还需要数量？本讲先把问题留下，后续分配器实现会解释数量如何帮助选择回收路径。眼下最重要的是契约本身。用五个元素的分配结果调用 `deallocate(p, 7)`，不是请求“多释放一点”，而是违反接口要求。

容器能把这种配对工作封装起来，因为它保存自身容量、节点和已构造元素等状态。课堂说这类工作由容器做更合适，并不是说人不可能正确使用 allocator，而是提醒直接使用者必须承担原本由容器负责的账目。

P3 还短暂说到归还给操作系统，随即纠正为先理解成“归还”。这处停顿值得保留：释放对象、归还分配器、分配器归还上游、进程资源变化，不必发生在同一时刻。

## 为什么课堂出现三种 allocator 写法

课件分别展示早期 VC、Borland 与 GNU 的接口，并用预处理条件选择写法。VC 的示例显式传入第二个提示参数；Borland 的例子省略它。旧 GNU 示例用无类型的 `alloc::allocate(512)`，以字节计数，调用形式也不同。

随后课件切换到 GNU 4.9 的例子：`allocator<int>().allocate(7)` 与 `__gnu_cxx::__pool_alloc<int>().allocate(9)`。这一步的重点有两个：现代一些的接口重新按元素数量工作；旧池化策略仍可作为扩展存在，却不等于标准默认分配器仍采用原策略。

**现代补充：**GNU 文档记录，GCC 3.4.0 之前默认采用池化分配器，之后默认策略改变，`__pool_alloc` 是可选扩展。因此不能把课程中的“换了名字”简化为“现代 `std::allocator` 就是旧 SGI 内存池”。[GNU 调试文档：默认池与非泄漏缓存](https://gcc.gnu.org/onlinedocs/libstdc++/manual/debug.html)

课件临时创建 allocator 对象来调用成员，适合展示这些历史无状态实现的用法。自己设计有状态分配器时，不能任意换一个不兼容的实例回收内存。更稳妥的学习写法是保留同一个 allocator 对象，并先明确实例之间的等价与资源关系。

## 现代实验：有了三个位置，不代表有了三个对象

下面是整理者补充的完整 **C++20** 示例。它把存储分配和对象构造拆开，在第三次构造时故意抛异常，然后只销毁已经构造成功的两个对象。课堂本篇主要展示分配接口；异常账目的展开用于连接后续 `new` 机制。

```cpp
#include <cassert>
#include <memory>
#include <stdexcept>

struct Item {
    static inline int alive = 0;
    int value;
    explicit Item(int v) : value(v) {
        if (v < 0) throw std::runtime_error("negative value");
        ++alive;
    }
    ~Item() { --alive; }
};

int main() {
    std::allocator<Item> allocator;
    using Traits = std::allocator_traits<decltype(allocator)>;
    Item* storage = Traits::allocate(allocator, 3);
    assert(Item::alive == 0); // 有存储，但尚无 Item 对象。
    std::size_t built = 0;
    try {
        for (int value : {10, 20, -1}) {
            Traits::construct(allocator, storage + built, value);
            ++built; // 构造成功后才计数。
        }
    } catch (const std::runtime_error&) {
        assert(built == 2 && Item::alive == 2);
    }
    assert(storage[0].value == 10 && storage[1].value == 20);
    while (built != 0) Traits::destroy(allocator, storage + --built);
    assert(Item::alive == 0);
    Traits::deallocate(allocator, storage, 3); // 数量须对应原分配。
}
```

`built` 是活对象数量；`3` 是分配的存储容量。异常使两者不同。销毁时按前者，归还时按后者；不能因为第三个对象没构造成功，就把原分配数量改成二。

`allocator_traits` 为分配器操作提供适配入口；这里 `construct` 建立对象、`destroy` 结束对象生命周期，`deallocate` 归还存储。[标准草案：allocator_traits 操作](https://eel.is/c++draft/allocator.traits.members)

示例已使用 Apple Clang 21、`-std=c++20 -Wall -Wextra -pedantic -fsanitize=address,undefined` 编译运行通过。它用于观察确定的构造失败，不是完整容器实现；一般应用优先使用标准容器和资源所有权对象，让正常路径与异常路径共享可靠的清理逻辑。

## 重点回看

时间以本次上传分 P 为坐标。ASR 对英文标识符有误识别，表中的技术名称已经对照课件纠正。

| 讲次与时间 | 画面／关键词 | 回看时关注什么 |
| --- | --- | --- |
| [P1 · 06:01–07:48](https://www.bilibili.com/video/BV1d3h5zFEjL/?p=1&t=361) | 先修、containers、allocator | 为什么理解管理机制之后，应用反而可能少写管理代码 |
| [P2 · 05:47–09:08](https://www.bilibili.com/video/BV1d3h5zFEjL/?p=2&t=347) | C++ Applications 层次图 | 从容器走向下层，以及直接 OS API 这条例外路径 |
| [P2 · 10:30–11:49](https://www.bilibili.com/video/BV1d3h5zFEjL/?p=2&t=630) | 四类 memory primitives 比较表 | 表达式、函数和可设计策略的区别 |
| [P3 · 05:45–07:35](https://www.bilibili.com/video/BV1d3h5zFEjL/?p=3&t=345) | `allocate(5)` / `deallocate(p,5)` | 元素数量与字节数，容器为什么要记账 |
| [P3 · 10:20–13:20](https://www.bilibili.com/video/BV1d3h5zFEjL/?p=3&t=620) | 旧 `alloc`、GNU 4.9、`__pool_alloc` | 不把历史接口和现代默认策略混在一起 |

## 思考与联系

1. 把实验输入改为 `{10, -1, 30}`，先预测 `built` 和 `alive`，再修改断言验证。销毁数量应变，分配与归还数量应保持三。
2. 如果把 `++built` 移到构造之前，第三次构造失败后会发生什么？通过逐步追踪指出哪一次析构找不到已存在的对象；不要用执行未定义行为作为验证正确性的依据。
3. 观察一个容器释放后进程内存统计没有立刻下降，是否足以证明泄漏？画出“容器—分配器—上游资源”的所有权关系，再设计重复申请／释放实验，区分可复用缓存与持续失去可达性的分配。

本站的 [GCC 5.4 shared_ptr 引用计数源码阅读](/blog/2020-07-15-sharedptr-cnt/) 可以接着看：被管理对象的销毁与控制块存储的释放可能分开，正好检验本篇建立的层次意识。那篇同样属于特定版本源码分析。

[设计模式中的共享与生命周期](/blog/2026-09-12-cpp-design-patterns-06-lifetime/) 则回答更上层的问题：是否共享状态、由谁持有、保留多久。分配器决定存储从哪里来，不会替应用决定哪些对象应该共享。
