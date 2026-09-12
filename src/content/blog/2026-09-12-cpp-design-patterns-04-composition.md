---
title: "C++ 设计模式学习笔记（四）：用组合拆开功能与变化方向"
date: 2026-09-12
type: 技术
tags: ["C++", "设计模式", "视频笔记", "vibe watching"]
summary: "从加密与缓冲流、跨平台通信软件的类爆炸问题，完整梳理装饰模式和桥接模式的重构步骤，理解接口继承、运行期组合、装饰顺序与独立变化方向。"
draft: false
---

本文是 [C++ 设计模式学习笔记系列](/blog/2026-09-12-cpp-design-patterns-01-foundations/)的第四篇，对应课程 P6 装饰模式与 P7 桥模式，后者也常译作桥接模式。文章由 AI 辅助整理，依据两讲完整音轨的本地自动转录和课件抽样核对。课堂的流处理与通信软件案例按重构顺序展开，完整代码则使用重新设计的 C++20 示例。

课程把这两种模式放在“单一职责”的主题下：当几种不同性质的变化都沿着同一条继承链扩展，类会越来越多，重复代码也会一起增长。解决问题需要先辨认不同职责，再决定哪些关系适合继承，哪些关系应该变成对象之间的组合。

> **来源档案**
>
> 讲者：**李建忠**；课程：**《C++设计模式》**，本次据带有 GeekBand 标识的 26 讲 B 站转载版本整理。本文对应：P6《装饰模式》、P7《桥模式》。
>
> 转载账号为“川中一郎”，合集标题《C++设计模式》，标识 **BV15pxQzSE8j**；上传者与原讲者分别署名。[讲者账号发布的《C++设计模式》试听](https://www.bilibili.com/video/BV1KB4y1Q7sQ/)可核对课程署名；[本次整理的转载合集](https://www.bilibili.com/video/BV15pxQzSE8j/)用于定位上述分 P。链接失效时，可用“李建忠 C++设计模式 GeekBand”及讲次标题检索。


## 一、一个流，为什么会长出那么多子类

P6 从 I/O 类库开始。系统有一个 `Stream` 接口，提供读取、定位、写入等操作；文件流、网络流、内存流分别实现它。

到这一步，继承关系表达的是不同的数据来源与读写方式，含义比较直接。接下来要增加加密功能，直觉做法是写一个 `CryptoFileStream`，继承 `FileStream`，在调用父类读写方法的前后增加加密相关处理。

然后同样的需求来到网络流和内存流，于是出现 `CryptoNetworkStream`、`CryptoMemoryStream`。

缓冲功能也采用同样方法，就有三种缓冲流。如果还需要既加密又缓冲，又要继续为不同流补上组合类。

| 基础流 | 加密 | 缓冲 | 加密与缓冲 |
| --- | --- | --- | --- |
| 文件 | 加密文件流 | 缓冲文件流 | 加密缓冲文件流 |
| 网络 | 加密网络流 | 缓冲网络流 | 加密缓冲网络流 |
| 内存 | 加密内存流 | 缓冲内存流 | 加密缓冲内存流 |

真正的问题不只是名字多。比较三个加密流就会发现：额外的加密算法几乎相同，不同的只是它们最终调用哪个基础流。相同的附加功能被复制到了多个继承分支里。

以后修复一次加密处理逻辑，需要检查所有复制点；再增加压缩或计数功能，还要考虑已有组合。类数量与维护工作一起增长，说明分类方式把两类职责绑在了一起：**流负责数据从哪里来、往哪里去，附加功能负责在这个过程前后增加什么处理。**

课程用类数量公式强调组合膨胀，本文保留这个增长问题，不照搬一个通用阶乘公式。准确数量取决于是否允许任意子集、顺序是否区分、同一种功能能否重复；这些条件不同，计数也不同。上表已经足够显示，仅三种基础流和两种附加功能，就产生了大量专用组合类。

## 二、装饰模式的关键，藏在中间几步重构里

只看最终 `Decorator` 类图，容易觉得它是凭空想出来的结构。课堂更有价值的部分，是逐步消掉那些重复代码。

### 第一步：把固定父类调用改成对象委托

原来 `CryptoFileStream` 继承文件流，方法里显式调用 `FileStream::Read()`。重构先让它保存一个文件流对象的指针，再通过指针调用读取操作。

网络版本同样处理。此时两个类还没有合并，但不同之处已经变得更小：它们各自持有不同具体类型的流，其他处理基本一致。

### 第二步：把具体指针提升为共同接口

文件流和网络流本来就遵守 `Stream` 接口，因此附加功能可以统一保存 `Stream*`。

这样，两个加密类连字段类型都相同了。它们真正的差别只剩下运行时传入什么对象，于是可以合并成一个 `CryptoStream`。缓冲功能同理，合并成一个 `BufferedStream`。

原本由类名表达的区别，现在由对象装配表达：同一个加密实现，既可以包住文件流，也可以包住网络流或内存流。

### 第三步：让附加功能本身也遵守流接口

仅仅保存一个 `Stream*` 还不够。`CryptoStream` 自己也要能被当作流使用，这样缓冲层才能继续包在它外面。

因此，装饰器在对外接口上继承 `Stream`，在内部实现上又持有一个 `Stream`。这两种关系做的是不同的事：继承让它满足同一个接口，组合让它把基础工作委托给另一个对象。

课堂讲到“为什么这里仍然需要继承”时，重点应理解为接口的可替换性，而不是虚函数语法本身。没有父类也可以声明虚函数，但那样并不会自动成为一个可供其他流装饰器包装的 `Stream`。

最终可以组装出这样的链：

```text
使用者 → BufferedStream → CryptoStream → FileStream
```

不需要再定义一个专门的 `CryptoBufferedFileStream`。每层只处理自己的职责，将其余工作委托给内层。

### 第四步：公共字段应该提到哪里

加密和缓冲装饰器现在都保存了一个流指针，是否应该把这个字段直接提到最顶层的 `Stream`？

课程指出，这会影响不需要包装其他流的 `FileStream`、`NetworkStream` 等主体。文件流本身能够完成工作，不应该因为装饰器的需求而被迫携带一个没有用途的内部流字段。

更合适的位置是一个中间基类 `DecoratorStream`。它继承 `Stream`，统一保存被包装对象；具体装饰器再继承它。

这个中间类帮助共享字段与转发逻辑，但不是模式成立的前提。如果只有一个很小的装饰器，直接实现接口并保存内部对象，也可以表达同样的设计意图。

## 三、完整例子：相同装饰层，顺序不同，结果不同

为避免把课堂的伪代码误当作完整加密和缓冲实现，下面改用文本生成。基础对象提供一段文字，两种装饰分别增加前缀、把 ASCII 小写字母转成大写。

这是一个完整的 C++20 程序。它用断言验证：同样两种装饰，调换顺序会改变结果；单个基础对象也可以独立工作。

```cpp
#include <cassert>
#include <memory>
#include <stdexcept>
#include <string>
#include <utility>

struct Text {
    virtual ~Text() = default;
    virtual std::string render() const = 0;
};

class Literal final : public Text {
    std::string value_;
public:
    explicit Literal(std::string value) : value_(std::move(value)) {}
    std::string render() const override { return value_; }
};

class TextDecorator : public Text {
    std::unique_ptr<Text> inner_;
protected:
    explicit TextDecorator(std::unique_ptr<Text> inner)
        : inner_(std::move(inner)) {
        if (!inner_) throw std::invalid_argument("missing inner text");
    }
    const Text& inner() const { return *inner_; }
};

class Prefix final : public TextDecorator {
    std::string prefix_;
public:
    Prefix(std::string prefix, std::unique_ptr<Text> inner)
        : TextDecorator(std::move(inner)), prefix_(std::move(prefix)) {}
    std::string render() const override {
        return prefix_ + inner().render();
    }
};

class AsciiUpper final : public TextDecorator {
public:
    explicit AsciiUpper(std::unique_ptr<Text> inner)
        : TextDecorator(std::move(inner)) {}
    std::string render() const override {
        auto result = inner().render();
        for (char& ch : result) {
            if (ch >= 'a' && ch <= 'z') {
                ch = static_cast<char>(ch - 'a' + 'A');
            }
        }
        return result;
    }
};

int main() {
    Literal plain("hello");
    assert(plain.render() == "hello");

    AsciiUpper upperOutside(std::make_unique<Prefix>(
        "note: ", std::make_unique<Literal>("hello")));
    Prefix prefixOutside("note: ", std::make_unique<AsciiUpper>(
        std::make_unique<Literal>("hello")));

    assert(upperOutside.render() == "NOTE: HELLO");
    assert(prefixOutside.render() == "note: HELLO");

    const Text& polymorphicView = upperOutside;
    assert(polymorphicView.render() == "NOTE: HELLO");
}
```

第一条链先由内层添加前缀，外层再对整个结果转大写，所以前缀也变成大写。第二条链先转换原始文字，外层随后添加前缀，因此前缀保留原样。

这也是理解真实流装饰器的一个提醒：能够任意装配，不等于所有装配都在业务上等价。缓冲层什么时候刷出数据、某层统计的是处理前还是处理后的字节数、压缩与加密的顺序如何约定，都需要接口语义与测试来明确。

这里每一层用 `unique_ptr` 独占内层对象，所有权沿链向内传递。销毁最外层时，整条链随之释放。`Text` 的虚析构保证通过基类拥有派生对象时正确析构；独占所有权的含义可以查阅 [C++ 标准草案的 `unique_ptr` 说明](https://eel.is/c++draft/unique.ptr)。

课堂为了演示不同装配方式，曾用多个裸指针指向同一个基础流。改写为独占指针时，不能直接让多个 `unique_ptr` 同时拥有这个地址。可以为每条独占链创建自己的基础对象；确实要共享时，则需要先确认共享状态和生命周期是否合理，再选择相应的所有权模型。

## 四、桥接模式：通信功能与运行平台是两个方向

P7 换成通信软件。最初的 `Messager` 把两组操作放在一起：一组是登录、发送消息、发送图片等业务功能；另一组是播放声音、绘图、写文字、建立连接等平台能力。

先按平台派生出 PC 和 Mobile，再分别增加精简版与增强版，就会出现四种组合：PC 精简版、PC 增强版、Mobile 精简版、Mobile 增强版。

平台变多、业务版本变多以后，类数量继续按组合增长。同样的业务步骤在不同平台分支里重复，而同样的平台实现又要服务于多个业务版本。

这与装饰器案例看起来很像，但需求有所不同。这里不是反复往一个对象外面附加功能，而是两套相对独立的分类：**提供哪种业务功能，以及借助哪个平台实现底层能力。**

### 从重复业务流程发现平台依赖

课堂先把精简版中对平台父类方法的调用，改成对一个平台对象的调用。PC 精简版和 Mobile 精简版逐渐变得相同，因为它们拥有同样的业务步骤，只是使用的平台对象不同。

增强版也可以做同样处理。平台选择从继承关系中的固定部分，变成构造时传入的对象。

这里还有一个容易被跳过的中间问题：如果继续保留原先那个混合接口，平台类只实现了平台方法，业务类只实现了业务方法，两边都没有完整实现所有纯虚函数。这个现象揭示了更深的职责问题——原来的接口把两套不同层次的工作混在一起了。

因此，重构不止是把继承换成一个指针，还要拆开接口。

### 两套接口，各自扩展

业务抽象继续提供登录和发送等操作，平台抽象单独提供业务所需的底层能力。业务对象保存平台接口，通过它完成实现。

于是形成两套层次：

```text
业务接口                    平台能力接口
├─ 精简版       ─────────→   ├─ PC 实现
└─ 增强版                    └─ Mobile 实现
```

新增 Linux 平台时，业务版本不必各自增加 Linux 子类；新增一个业务版本时，也不必在每个平台分支复制一遍。类定义主要沿两个方向分别增长，能够运行的组合仍由装配决定。

这里说的独立，并不是双方完全没有约束。业务层仍然依赖平台能力接口；如果新业务需要接口里从未表达过的能力，就可能需要扩充接口、调整实现。桥接隔离的是已经识别出的变化方向，不是预先解决所有未来需求。

GoF 中的 `Abstraction` 和 `Implementor` 容易让人误以为“一边抽象，一边必然是具体类”。实际上，两侧都可以有抽象接口。名称表达的是各自在桥接关系里的角色：一边提供较高层的业务操作，另一边提供这些操作所依赖的实现能力。

## 五、再用一个小程序验证两个方向能独立装配

下面的原创示例将平台能力缩减为“发送一段文字”，以记录对象模拟两个不同平台。普通通信器直接发送，提醒通信器在发送前增加提示前缀。它是完整的 C++20 程序，不依赖真实网络。

```cpp
#include <cassert>
#include <string>
#include <string_view>
#include <vector>

struct Channel {
    virtual ~Channel() = default;
    virtual void send(std::string_view message) = 0;
};

class RecordingChannel final : public Channel {
public:
    std::vector<std::string> messages;
    void send(std::string_view message) override {
        messages.emplace_back(message);
    }
};

class Messenger {
    Channel& channel_; // 借用的平台能力，必须比本对象活得久
protected:
    explicit Messenger(Channel& channel) : channel_(channel) {}
    void transmit(std::string_view message) { channel_.send(message); }
public:
    virtual ~Messenger() = default;
    virtual void send(std::string_view message) = 0;
};

class PlainMessenger final : public Messenger {
public:
    explicit PlainMessenger(Channel& channel) : Messenger(channel) {}
    void send(std::string_view message) override { transmit(message); }
};

class AlertMessenger final : public Messenger {
public:
    explicit AlertMessenger(Channel& channel) : Messenger(channel) {}
    void send(std::string_view message) override {
        transmit("Alert: " + std::string(message));
    }
};

int main() {
    RecordingChannel desktop;
    RecordingChannel mobile;
    PlainMessenger plainDesktop(desktop);
    AlertMessenger alertDesktop(desktop);
    PlainMessenger plainMobile(mobile);
    AlertMessenger alertMobile(mobile);

    plainDesktop.send("one");
    alertDesktop.send("two");
    plainMobile.send("three");
    alertMobile.send("four");
    assert((desktop.messages == std::vector<std::string>{"one", "Alert: two"}));
    assert((mobile.messages == std::vector<std::string>{"three", "Alert: four"}));
}
```

两个记录对象只是测试替身，用来验证不同组合的路由。真实项目可以分别实现桌面和移动平台接口，而两种业务类继续使用同一个 `Channel` 协议。示例中没有定义任何 `DesktopAlertMessenger` 之类的交叉组合类型。

这里接口也有一个小而重要的约定：`send()` 在调用期间消费传入的文字。记录实现立即复制字符串，因此提醒版本传入的临时字符串不会形成悬空引用。如果某个平台实现改成异步排队，就必须取得数据的所有权，不能把这个临时 `string_view` 保存到稍后使用。模式解决依赖组织，接口仍要讲清楚资源和时间约束。

## 六、装饰与桥接的区别，不在于谁“使用了组合”

| 观察角度 | 装饰模式 | 桥接模式 |
| --- | --- | --- |
| 主要需求 | 在已有对象上增加可组合职责 | 让两种变化方向独立扩展 |
| 典型组织 | 包装者与被包装者遵守同一接口 | 高层业务使用另一套实现能力接口 |
| 组合形状 | 经常可以逐层嵌套 | 通常连接两套职责层次 |
| 课堂案例 | 基础流叠加加密、缓冲 | 业务版本搭配运行平台 |
| 需要特别注意 | 装饰顺序、所有权、层间语义 | 能力接口的稳定性与粒度 |

不能看到“继承一个接口，又保存同接口指针”就断定它一定是装饰器。代理、组合模式等也可能出现相似结构。应当继续追问：这个对象是在增加职责、控制访问，还是组织部分与整体？类图只能提供线索。

桥接也不是任何“类里有一个指针”的别名。需要能够解释为什么两侧属于不同变化方向，以及通过这个能力接口隔离以后，哪些新增需求可以分别完成。如果两侧总是一起变化，只是为了套模式硬拆开，额外接口可能只有转发成本。

同样，课程所说组合优于继承，并不等于完全排斥继承。装饰和桥接的最终方案仍然使用接口继承；被替换的是用具体实现继承同时承载多个变化方向的做法。选择依据始终是职责和变化，而不是某个语法看起来更现代。

## 来源与阅读位置

课程来源为 [P6 装饰模式](https://www.bilibili.com/video/BV15pxQzSE8j/?p=6)和 [P7 桥模式](https://www.bilibili.com/video/BV15pxQzSE8j/?p=7)。整理时阅读了完整音轨的自动转录，并核对 P6 的 14 帧、P7 的 8 帧课件与代码抽样。流接口中的算法省略、指针管理，以及通信平台能力都属于教学模型，不能直接视为生产级类库设计。

两个可运行示例、所有权分析、装饰顺序及异步参数生命周期说明属于整理时的补充。类数量部分依据实际组合条件重新解释，没有沿用课件中缺少明确计数前提的公式。

上一篇：[对象创建与产品族](/blog/2026-09-12-cpp-design-patterns-03-creation/) · 下一篇：[边界、访问与协作](/blog/2026-09-12-cpp-design-patterns-05-boundaries/)
