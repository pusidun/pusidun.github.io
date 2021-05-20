---
layout: post
title: fold expressions
date: 2020-09-03
tags: modern_c++
---

<!-- TOC -->

- [C++17 Fold Expressions](#c17-fold-expressions)
  - [用折叠表达式简化以前的代码](#用折叠表达式简化以前的代码)
  - [如何使用折叠表达式](#如何使用折叠表达式)
    - [一元折叠](#一元折叠)
    - [二元折叠](#二元折叠)
    - [lambda表达式使用fold expressions](#lambda表达式使用fold-expressions)

<!-- /TOC -->

## C++17 Fold Expressions

本文介绍C++17新特性折叠表达式。文章示例代码通过MinGW编译，宏__cplusplus=201703

下面我们从一个模板函数sum开始，介绍折叠表达式。

### 用折叠表达式简化以前的代码

C++11引入了变长参数模板，我们想求变长参数的和，可以这样写模板函数

```
template <typename T>
auto sum(T arg){
    return arg;
}

template <typename T1, typename... T>
auto sum(T1 arg, T... args){
    return arg + sum(args...);
}

int main() {
    std::cout<<sum(1,2,3)<<std::endl;
    return 0;
}
```
注：这里用到了auto推导，C++14编译没问题。用C++11编译的读者记得在函数签名后面加"-> T"

为了完成sum这个函数，我们需要写2个函数。一个进行递归，一个作为递归返回条件。这种模板的递归是在编译时发生的，遇到复杂的递归会大大加大编译时间。有没有办法写**一个**模板函数，同时又能实现sum功能呢？

有，就是**折叠表达式**

我们看下折叠表达式的写法

```
template <typename... T>
auto sum_folder(T... args) {
    return (... + args);
}

int main() {
    std::cout<<sum_folder(1,2,3)<<std::endl;
    return 0;
}
```

这里折叠表达式会将sum_folder(1,2,3)扩展成(1+(2+3))

### 如何使用折叠表达式

看了上面的例子，相信读者对折叠表达式已经有了直观的认识。下面我们详细介绍下折叠表达式的使用。

#### 一元折叠

假设参数是args，操作符是op。一元折叠有两种情况：左折叠和右折叠
1. unary left fold:  (... op args)  expends to ((arg1 op arg2) op arg3) + ... 
2. unary right fold: (args op ...)  expends to arg1 op (arg2 op ... (argN-1 op argN))

举2个例子方便理解

左折叠
```
template<typename... T>
string combine_str_left(T... args) {
    return (... + args);
}

string s("head");
// expand to (s+" ") + "tail"
std::cout<<combine_str_left(s," ","tail")<<std::endl;
```

右折叠
```
template<typename... T>
string combine_str_right(T... args) {
    return (args + ...);
}
```
右折叠就不能combine_str_right(s," ", "tail")这么写，因为扩展开来是s + (" " + "tail")显然两个字面值是不能直接相加的。所以比起右折叠，左折叠用的比较多。

#### 二元折叠

1. binary left fold: (value op ... op args) expand to ((value op arg1) op arg2) op ...
2. binary right fold: (args op ... op value) expand to args1 op (arg2 op ... ( argN op value))

同样举个左折叠的例子

```
template<typename... T>
void print(const T&... args) {
    (std::cout << ... << args);
}

print("a","b", "c"); // print abc
```

想让各个参数中间打印一个空格，可以使用一个lambda处理下
```
template<typename First, typename... T>
void print(const First& first,const T&... args) {
    std::cout<<first;
    auto whiteSpaceWrapper = [](const auto& arg){
        std::cout<<" ";
        return arg;
    };
    (std::cout << ... << whiteSpaceWrapper(args));
}
```

#### lambda表达式使用fold expressions

折叠表达式不仅用于模板，也可以用在lambda表达式里面

```
auto print = [](auto&... args){ (std::cout << args << ... ) << '\n';};
print("first", "second", "third");
```
