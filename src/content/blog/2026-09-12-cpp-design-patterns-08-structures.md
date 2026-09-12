---
title: "C++ 设计模式学习笔记（八）：组合、遍历与操作扩展"
date: 2026-09-12
type: 技术
tags: ["C++", "设计模式", "视频笔记", "vibe watching"]
summary: "结合树节点、集合访问、双重分派和加减表达式的课堂推导，整理组合模式、迭代器、访问者与解释器，比较结构、遍历、操作和文法各自的变化，以及现代 C++ 的实现边界。"
draft: false
---

[返回系列目录与学习方法](/blog/2026-09-12-cpp-design-patterns-01-foundations/)

这篇笔记整理[第 20 讲：组合模式](https://www.bilibili.com/video/BV15pxQzSE8j/?p=20)、[第 21 讲：迭代器](https://www.bilibili.com/video/BV15pxQzSE8j/?p=21)、[第 24 讲：访问者](https://www.bilibili.com/video/BV15pxQzSE8j/?p=24)与[第 25 讲：解释器](https://www.bilibili.com/video/BV15pxQzSE8j/?p=25)。后两讲的上传标题分别写作“访问器”和“解析器”，本文按 Visitor、Interpreter 的常见中文名称讨论。

本文由 AI 阅读四讲完整音频转录，并对照课件与代码抽样画面整理，归入 `vibe watching`。课堂的节点示例与表达式推导会分别说明；后面的完整 C++20 程序是原创整合示例，不是视频源码的逐字转录。

这四个模式都可能出现在树结构附近，却没有解决同一个问题。组合模式让客户一致对待部分与整体；迭代器提供访问元素的协议；访问者改变新增操作的位置；解释器让重复的领域规则获得可执行的表示。把它们全部堆到同一棵树上，并不自动得到更好的设计。

> **来源档案**
>
> 讲者：**李建忠**；课程：**《C++设计模式》**，本次据带有 GeekBand 标识的 26 讲 B 站转载版本整理。本文对应：P20《组合模式》、P21《迭代器》、P24《访问器》（访问者）、P25《解析器》（解释器）。
>
> 转载账号为“川中一郎”，合集标题《C++设计模式》，标识 **BV15pxQzSE8j**；上传者与原讲者分别署名。[讲者账号发布的《C++设计模式》试听](https://www.bilibili.com/video/BV1KB4y1Q7sQ/)可核对课程署名；[本次整理的转载合集](https://www.bilibili.com/video/BV15pxQzSE8j/)用于定位上述分 P。链接失效时，可用“李建忠 C++设计模式 GeekBand”及讲次标题检索。


## 组合模式：让客户不用区分叶子与整棵子树

课堂先提出一个依赖问题：对象内部有复杂容器或树形结构，如果客户必须知道这些结构，内部布局变化就会传到客户代码。

例如，客户收到一个节点，要先判断它是叶子还是容器。叶子直接处理；容器则取出子项，再判断子项是什么类型。处理树的知识散落在客户中，每增加一种组合方式，都可能牵动多个调用位置。

组合模式把共同操作放到一个抽象接口上。叶子完成自己的工作，组合节点完成当前节点的工作，再把相同操作交给子节点。于是客户只需知道如何处理一个抽象节点。

### 课堂怎样把一棵树搭起来

视频定义 `Component`，提供 `process` 操作；`Leaf` 表示叶节点；`Composite` 保存一组 `Component` 指针。子项既可以是叶，也可以是另一个组合节点。

`Composite::process` 分成两步：先处理自己，再遍历子项，对每个子项调用虚 `process`。如果子项是组合节点，就继续沿它自己的子树处理；如果是叶子，就执行叶子的处理并结束这条分支。

这里不是同一个对象无限调用自己，而是调用另一个节点的同名操作。递归沿结构展开，多态决定当前节点采用哪一种实现。

主程序建立 `root`、四个中间节点和两个叶节点，再通过添加关系形成多层树。客户函数 `Invoke(Component&)` 只调用 `process`。把整棵树、某个中间子树或单个叶子传进去，都不需要改变客户的调用方式。

课程把这称为从“一对多”转成“一对一”。准确地说，是客户只面向一个入口对象；内部仍然会遍历许多节点，时间和空间成本没有凭空消失。

### 统一操作，不一定要统一所有管理接口

这一讲很有价值的一段讨论，是 `add`、`remove` 应该放在哪里。

如果放到 `Component`，客户能够用同一种接口管理所有节点。但叶子没有子节点，调用它的 `add` 应该发生什么？什么都不做会让调用者误以为添加成功；直接拒绝，又说明这个操作并非所有节点都能合理支持。

如果只放到 `Composite`，叶子不再背负不适用的操作，但构造或编辑树时，客户需要知道当前对象具不具备组合能力。课堂采用后一种实现，同时承认它牺牲了管理接口上的统一性。

这里需要区分两件事：业务处理可以统一，例如求大小、绘制、执行；结构编辑未必适合统一。不要为了让类图对称，让每个叶子都拥有一个无法兑现的承诺。

抛异常也不是自动违反替换原则。关键在于基类契约是否承诺操作一定受支持。如果基类已经把“不支持”写进协议，那是另一种取舍；如果基类承诺可以添加，子类却永远拒绝，调用者才会遇到替换问题。

### 树结构还要回答所有权问题

父节点是否拥有子节点？一个子节点能不能同时挂到两个父节点？是否需要通过子节点找到父节点？这些都会影响结构的含义。

用独占所有权表示一棵树很直接：父节点拥有子节点，销毁父节点时递归释放子树。若允许共享节点，结构更接近有向图，需要重新考虑重复计算、循环和生命周期，不能只把指针换成 `shared_ptr` 就视为问题已解决。

课程也提到反向查找父节点、为频繁遍历增加缓存。它们是具体实现的选择，不是组合模式必须附带的能力。缓存还会引入新的问题：结构改变后，谁保证缓存失效？

## 迭代器：把遍历协议与容器表示分开

组合模式可以把一项操作递归地传给子节点，但客户有时需要自己决定如何处理每一个元素，而且这些元素未必来自树。

课堂用数组式容器、链表和树等不同结构说明这一需求：希望同一个算法能够依次取得元素，却不必知道底层怎样存储。迭代器位于算法与容器之间，把“如何找到下一个元素”封装起来。

### GoF 示例的四个动作

视频的迭代器接口提供四种操作：移到开始、移到下一项、判断是否结束、取得当前元素。具体集合负责创建与自己匹配的迭代器；迭代器内部知道集合结构，客户只使用这组协议。

客户的循环于是变成：取得迭代器，初始化，检查结束条件，处理当前元素，再前进。算法不用直接操纵链表指针，也不用读取树节点内部的孩子数组。

课程把它分成两层意思：

- **迭代抽象**：访问内容时不暴露聚合内部表示。
- **统一访问协议**：让同一种算法能够作用于不同集合。

这两层意图比接口一定叫 `first` 还是 `next` 更重要。有的协议把前进与取值合并，有的分开，都可以服务于相同目的。

### 为什么 C++ 课程紧接着讨论模板

GoF 示例通过虚函数表示上述协议。课堂随后把它与 STL 迭代器比较：如果每轮都进行多次动态分派，元素数量很大时，调用开销值得注意；模板则可以让具体类型与操作在编译期被识别，为优化提供更多机会。

这不是说迭代器思想过时，也不是运行时多态在所有场景下都更慢。更准确的结论是：C++ 已有成熟的泛型访问协议，通常没有必要为了使用这个模式，再为每个容器设计一套逐元素虚调用接口。

同时，迭代器并不是统一拥有所有能力。单向前进、双向移动、随机跳转，对底层结构的要求不同。链表迭代器能够逐步移动，并不因此能够像数组迭代器一样直接执行 `it + n`。课程列举了输入、输出、前向、双向、随机访问等类别；现代标准还明确了连续迭代器的概念。具体能力应以[标准的迭代器要求](https://eel.is/c++draft/iterator.requirements.general)为准。

下面是一个示意片段，省略所需头文件与调用端。它在遍历能力上只要求读取并前进，没有向容器索要随机访问能力；元素还需要支持流输出：

```cpp
template<std::input_iterator I, std::sentinel_for<I> S>
void print_values(I first, S last) {
    for (; first != last; ++first) {
        std::cout << *first << '\n';
    }
}
```

算法需要什么能力，就要求什么能力。把本来只需要顺序读取的算法绑定到某个具体容器，同样会浪费迭代抽象带来的空间。

### 结构改变以后，旧迭代器还有效吗

课程最后提醒，遍历的同时改变集合结构可能导致问题。它不是要求所有迭代器都只能读取，也不是禁止修改元素值。

需要区分的是：改变某个元素的内容，与插入、删除、重新分配存储等结构性变化。哪些操作使迭代器失效，要看具体容器与具体操作。迭代器隐藏了容器表示，并没有消除底层存储的生命周期。

对于一棵树，还应说明遍历采用前序、后序还是其他顺序；是否包含组合节点自身；遍历期间允许哪些修改。仅仅提供一个 `next`，还不足以让使用者预测行为。

## 访问者：当元素种类稳定，操作却不断增加

访问者一讲从另一种变化开始：已经完成的类层次结构，现在需要为每一种元素增加新操作。

课堂使用 `Element`、`ElementA`、`ElementB` 的小例子。原来只有一组行为，新的需求让开发者想在基类里增加 `Func2`，再到每个子类实现它。过一段时间还要增加 `Func3`、`Func4`，改动就不断横穿整个元素体系。

如果这些操作的变化频率很高，而元素种类相对固定，可以考虑把每种操作从元素类中提取出来。访问者提供的，是这样一个特定方向的扩展能力。

### 先预留 accept，再把新操作放到新访问者里

课程的重构分成两步。

第一步，为元素体系预留 `accept(Visitor&)`。`Visitor` 接口则列出对 `ElementA`、`ElementB` 的访问操作。每个元素的 `accept` 调用与自己类型对应的方法，并把自身传过去。

第二步，以后新增一类操作，就增加一个具体访问者。`Visitor1` 包含对 A、B 的第一组处理，`Visitor2` 包含对 A、B 的另一组处理。元素类不必再为每一种新操作添加成员函数。

视频用一条横线区分预先准备的元素协议与后来增加的具体访问者。这条线表达了模式的前提：现有体系已经提供扩展入口。不能拿一个完全没有相关协议的第三方类，声称访问者会自动给它增加新行为。

### 双重分派究竟发生在哪里

课堂反复追踪这个调用过程，因为最容易看懂类图却没看懂实际选择。

假设一个 `Element&` 实际引用 B，一个 `Visitor&` 实际引用 `Visitor2`：

1. 调用元素的虚 `accept`，根据元素实际类型进入 `ElementB::accept`。
2. 在 B 的 `accept` 内，调用访问者的 B 操作；根据访问者实际类型进入 `Visitor2` 的对应实现。

最终选择同时取决于“这是哪一种元素”和“要做哪一种操作”。这就是这里的双重分派。它不是把整棵树遍历两遍。

若接口使用同名重载 `visit(A&)`、`visit(B&)`，还要注意 C++ 的分工：元素的 `accept` 内已知自己的静态类型，由此选中重载；随后虚分派选择具体访问者的覆盖实现。不能把普通重载理解成自动按照参数运行时类型选择。[C++ 虚函数规则](https://eel.is/c++draft/class.virtual)区分了这些机制。

### 它只是把容易变化的方向换了一边

现在新增一种操作很方便：增加一个访问者即可。但新增 `ElementC` 会怎样？`Visitor` 接口需要知道 C，现有具体访问者也可能要补上 C 的处理。

访问者并没有让所有扩展都变容易。它让“操作增加”更加集中，代价是“元素种类增加”会横向影响访问者体系。

课堂用图形类型举例提醒这一点：如果以后还会不断增加新形状，元素集合未必能够固定，传统访问者就可能不合适。若操作种类本来也很少且稳定，直接放在元素上反而清楚。

此外，访问者需要获得完成操作所需的信息。如果为此公开所有内部字段，就可能破坏封装。合适的访问接口、只读视图或领域查询仍然需要设计；“把操作移出去”并不意味着状态边界可以一并放弃。

## 解释器：把反复出现的规则写成一种语言

解释器一讲讨论的变化不是“再加一个处理函数”，而是用户不断给出不同的规则表达式。

如果每个新表达式都需要重新写程序，变化就直接落到代码上。但当表达式有重复结构，可以把它们归纳成文法，构造统一的解释过程。新的需求实例变成文法中的新句子，而不总是程序的新分支。

### 课堂实际计算的是 a+b-c+d

视频示例使用单字符变量和加减运算：

```text
a + b - c + d
```

给定 `a=5、b=2、c=1、d=6`，结果为 12。课堂随后追加 `-e`，把 `e` 设为 10，结果变成 2。

推导从最小重复结构开始：a 和 b 可以形成加法表达式；这个表达式的结果又能作为左操作数，与 c 形成减法表达式；减法结果再与 d 组合。于是得到一棵表达式树：

```text
        +
       / \
      -   d
     / \
    +   c
   / \
  a   b
```

变量是叶子。加法与减法是包含左右表达式的组合节点。每一种节点都回答同一个问题：在给定变量环境下，我的值是什么？

变量节点查询环境中的值；加法节点解释左右子树后相加；减法节点解释左右子树后相减。这里再次出现组合模式式的递归结构，但多了明确的文法与求值语义。

### 构造语法树与解释语法树是两项工作

课堂先用 `analyse` 扫描字符串、构建树，再调用树上的 `interpreter` 计算结果。

构树过程使用栈。读到第一个变量，建立变量节点；遇到加减号，从栈顶取出已构造的左表达式，再读取下一个变量作为右表达式，构造新的运算节点并压回。最后取得的根节点代表整个表达式。

这个简单算法依赖明确限制：运算符只有加减，操作数都是单字符变量，按左结合处理。它没有完成一般四则表达式解析。

加入乘除，就需要处理优先级；加入括号，解析规则还要继续变化。只是在原来的 `switch` 里多写两个运算符分支，不能保证获得正确语法树。课堂把这些留作后续练习。

从这个例子应该保留的，是“表达式结构—节点类型—递归语义”的对应关系，而不是把简化扫描程序当作可处理任意输入的解析器。

### 规则需要多复杂，才值得引入解释器

课程给出的另一个场景是把人民币大写金额转为数值：文字形式可以变化，但背后有可抽象的规则。这里只是口述应用，没有完成金额转换程序。

适合这种思路的条件包括：实例经常变化，结构反复出现，而且能够提炼成文法。若始终只计算一个固定公式，直接写清楚计算过程就够了。

反过来，规则过于复杂时，每个文法成分都建立一个类，也可能产生庞大的体系。语法、语义、错误位置与性能都需要处理，讲者因此建议考虑成熟的语法分析工具。工具能帮助构建语法结构，却不会替开发者决定每条规则的业务含义。

新增运算也不一定“完全不改旧代码”。除了增加表达式类型，解析前端可能要认识新符号，访问者可能要增加新方法，测试还要覆盖优先级与错误输入。开闭能力总有具体方向。

## 一个完整例子：求值在节点里，打印在访问者里

下面是原创的 C++20 整合程序。它直接构造表达式树，没有实现字符串解析器；目标是让组合、解释与访问者的职责能够在一段代码里对应起来。

节点种类固定为变量、加法、减法。求值属于节点现有的解释操作，后加入的打印能力通过访问者实现。使用 `unique_ptr` 表示树的独占所有权，变量环境以只读引用传入；变量缺失或出现非有限数值时明确报错。

示例使用 `double`，不提供任意精度或精确金额计算。它验证本例的整数范围结果，不能据此把浮点数当作适用于所有规则语言的数值类型。

```cpp
#include <cassert>
#include <cmath>
#include <map>
#include <memory>
#include <stdexcept>
#include <string>
#include <utility>

class Variable;
class Add;
class Subtract;

class Visitor {
public:
    virtual ~Visitor() = default;
    virtual void visit(const Variable&) = 0;
    virtual void visit(const Add&) = 0;
    virtual void visit(const Subtract&) = 0;
};

using Context = std::map<char, double>;

class Expression {
public:
    virtual ~Expression() = default;
    virtual double evaluate(const Context&) const = 0;
    virtual void accept(Visitor&) const = 0;
};
using Expr = std::unique_ptr<Expression>;

double finite_value(double value) {
    if (!std::isfinite(value)) {
        throw std::domain_error("non-finite value");
    }
    return value;
}

class Variable final : public Expression {
    char name_;
public:
    explicit Variable(char name) : name_(name) {}
    char name() const { return name_; }
    double evaluate(const Context& context) const override {
        return finite_value(context.at(name_));
    }
    void accept(Visitor& visitor) const override {
        visitor.visit(*this);
    }
};

class Binary : public Expression {
    Expr left_;
    Expr right_;
public:
    Binary(Expr left, Expr right)
        : left_(std::move(left)), right_(std::move(right)) {
        if (!left_ || !right_) {
            throw std::invalid_argument("missing operand");
        }
    }
    const Expression& left() const { return *left_; }
    const Expression& right() const { return *right_; }
};

class Add final : public Binary {
public:
    using Binary::Binary;
    double evaluate(const Context& context) const override {
        return finite_value(left().evaluate(context)
                          + right().evaluate(context));
    }
    void accept(Visitor& visitor) const override {
        visitor.visit(*this);
    }
};

class Subtract final : public Binary {
public:
    using Binary::Binary;
    double evaluate(const Context& context) const override {
        return finite_value(left().evaluate(context)
                          - right().evaluate(context));
    }
    void accept(Visitor& visitor) const override {
        visitor.visit(*this);
    }
};

class Printer final : public Visitor {
    std::string result_;
public:
    static std::string print(const Expression& expression) {
        Printer printer;
        expression.accept(printer);
        return printer.result_;
    }
    void visit(const Variable& variable) override {
        result_ = std::string(1, variable.name());
    }
    void visit(const Add& add) override {
        result_ = "(" + print(add.left()) + "+"
                      + print(add.right()) + ")";
    }
    void visit(const Subtract& subtract) override {
        result_ = "(" + print(subtract.left()) + "-"
                      + print(subtract.right()) + ")";
    }
};

Expr variable(char name) {
    return std::make_unique<Variable>(name);
}

int main() {
    Context context{{'a', 5}, {'b', 2}, {'c', 1}, {'d', 6}};
    Expr expression = std::make_unique<Add>(
        std::make_unique<Subtract>(
            std::make_unique<Add>(variable('a'), variable('b')),
            variable('c')),
        variable('d'));

    const double value = expression->evaluate(context);
    const auto text = Printer::print(*expression);
    assert(value == 12);
    assert(text == "(((a+b)-c)+d)");

    context.emplace('e', 10);
    expression = std::make_unique<Subtract>(
        std::move(expression), variable('e'));
    const double extended = expression->evaluate(context);
    assert(extended == 2);

    bool missing_variable = false;
    try {
        variable('z')->evaluate(context);
    } catch (const std::out_of_range&) {
        missing_variable = true;
    }
    assert(missing_variable);
}
```

先看组合这一层：`Expression` 是统一入口，变量与二元表达式都能求值。`Binary` 拥有两个表达式，具体运算递归调用它们。客户不需要先判断根节点是哪种类型。

再看解释这一层：同样的树结构被赋予变量查询、加法和减法的含义。`Context` 提供本次求值所需的外部信息，改变变量值不需要重建节点类。使用 `at` 也避免了未知变量悄悄变成零。

最后看访问者这一层：`Printer::print` 面向抽象 `Expression`。第一次虚调用进入具体节点的 `accept`，该节点再调用访问者的对应方法。打印算法集中在 `Printer`，没有给每个节点继续添加 `print` 成员。

如果以后增加“收集所有变量名”的操作，可以再写一个访问者。如果增加乘法节点，则需要更新访问者协议，并补上打印乘法的方式。这正好展示了访问者的收益和代价。

这里没有强行再放入一个自定义迭代器。求值必须保留树的分组关系，不能随意把节点摊平后按访问顺序计算。若客户需要统一枚举所有节点，用于统计或检索，再提供合适的遍历协议即可。**能够组合使用，不等于每个例子都应该用齐。**

独占指针解决了本例节点的释放，但不会限制树深度。面对不受控的巨大输入，递归求值、打印和析构都需要考虑深度与资源限制；字符串反复拼接的成本也需要另行评估。教学例子展示职责，不承担通用语言运行时的全部任务。

## 四种变化，分别放在哪里

| 需求变化 | 主要问题 | 可以考虑的方向 |
| --- | --- | --- |
| 单个对象与嵌套整体都要执行相同操作 | 客户反复判断叶子和容器 | 组合模式 |
| 算法不应依赖具体容器布局 | 如何访问下一个元素 | 迭代器 |
| 元素类型稳定，操作不断增加 | 每次新增操作都改所有元素类 | 访问者 |
| 需求实例不同，但重复遵守同一文法 | 如何表达并执行领域规则 | 解释器 |

这张表也能反过来检查设计。只是遍历一个 `vector`，不需要先做组合模式；只是给节点加一个稳定的核心行为，不一定需要访问者；只是计算固定公式，不一定需要一门表达式语言。

课程在这些章节里不断提醒技术与语言环境会改变实现形式。C++ 可以用模板迭代器、范围、函数对象，也可以在类型集合固定时考虑 `variant` 一类表示。选择这些机制之后，原来的问题仍然存在：谁拥有节点，哪些结构会变，新增一种操作会影响哪些地方，错误输入如何处理？

模式的价值，是帮助把这些变化放到可以理解的位置。看见一个树形图之后，更值得先问“什么在变化”，再决定是否需要递归组合、外部遍历、双重分派或文法解释。

上一篇：[职责链与命令](/blog/2026-09-12-cpp-design-patterns-07-requests/) · [返回系列目录](/blog/2026-09-12-cpp-design-patterns-01-foundations/)
