---
layout: post
title: socket编程(一)
date: 2021-05-18
tags: Linux
---
<!-- TOC -->

- [IPv4套接字地址结构](#ipv4套接字地址结构)
- [字节序转换函数](#字节序转换函数)
- [地址转换函数](#地址转换函数)
- [套接字类型](#套接字类型)
- [socket、bind、listen、accept、connect](#socketbindlistenacceptconnect)
- [SO_REUSEADDR](#so_reuseaddr)
- [p2p聊天demo](#p2p聊天demo)

<!-- /TOC -->
## IPv4套接字地址结构

```
#include <netinet/in.h>
/* sockaddr_in */

struct in_addr {
    in_addr_t        s_addr;         /* 23 bits IPv4 address */
};                                   /* network byte ordered */
 
struct sockaddr_in {
    uint8_t          sin_len;        /* length of structure(16) */
    sa_family_t      sin_family;     /* AF_INET */
    in_port_t        sin_port;       /* 16-bit TCP or UDP port number */
                                     /* network byte ordered */
    struct in_addr   sin_addr;       /* 32-bit IPv4 address */
                                     /* network byte ordered */
    char             sin_zero[8];    /* unused */
};
 
 
/*
sin_len成员
表示地址结构体的长度，它是一个无符号的八位整数。
需要强调的是，这个成员并不是地址结构必须有的。
假如没有这个成员，其所占的一个字节被并入到sin_family成员中；
同时，在传递地址结构的指针时，结构长度需要通过另外的参数来传递。
sin_family成员
指代的是所用的协议族，在有sin_len成员的情况下，它是一个8位的无符号整数；
在没有sin_len成员的情况下，它是一个16位的无符号整数。
由于IP协议属于TCP/IP协议族，所以在这里该成员应该赋值为“AF_INET”。
sin_port成员
表示TCP或UDP协议的端口号，它是一个16位的无符号整数。
它是以网络字节顺序（大端字节序）来存储的。
in_addr成员
用来保存32位的IPv4地址，它同样是以网络字节顺序来存储的。
sin_zero成员
是不使用的，通常会将它置为0，它的存在只是为了与通用套接字地址结构struct sockaddr在内存中对齐。
*/
```

## 字节序转换函数

```
#include<arpa/inet.h>
//函数中 h代表host    n代表network    s代表short   l代表long

// hton* 主机字节转网络字节序
 
uint32_t htonl(uint32_t hostlong);
 
uint16_t htons(uint16_t hostshort);
 
 
// ntoh* 网络字节序转主机字节序
 
uint32_t ntohl(uint32_t netlong);
 
uint16_t ntohs(uint16_t netshort);
```

## 地址转换函数

```
#include <arpa/inet.h>

int         inet_aton (const char *__cp, struct in_addr *__inp);
int         inet_pton(int af, const char *restrict src, void *restrict dst);
in_addr_t   inet_addr (const char *__cp);
char *      inet_ntoa (struct in_addr __in);
const char *inet_ntop(int af, const void *restrict src,
                             char *restrict dst, socklen_t size);

/* 
以上三个函数在点分十进制数串（如“127.0.0.1"）和32位网络字节序二进制值之间转换IPv4地址。
 
inet_aton将__cp指向的字符串转成网络序的地址存在__inp指向的地址结构。
成功返回1，否则返回0。
(据书中所说，如果__inp指针为空，那么该函数仍然对输入字符串进行有效性检查但是不存储任何结果)

inet_pron将字符串转换成指定协议族的网络地址，并将其拷贝到dst网络地址结构体中。成功返回1，失败返回0并设置errno

inet_addr功能和inet_aton类似，
但是inet_addr出错时返回INADDR_NONE常值（通常是32位均为1的值），
这就意味着至少有一个IPv4的地址（通常为广播地址255.255.255.255）不能由该函数处理。
建议使用inet_aton代替inet_addr。

inet_ntoa将网络序二进制IPv4地址转换成点分十进制数串。
该函数的返回值所指向的字符串驻留在静态内存中。
这意味着该函数是不可重入的。
同时我们也该注意到该函数以一个结构体为参数而不是常见的以一个结构体指针作为参数。

inet_ntop扩展inet_ntoa功能，支持不同协议族从网络地址到字符串的转换。如果成功，函数返回指向dst的非空指针。如果失败返回NULL，并设置errno
*/
 ```

## 套接字类型

1. SOCK_STREAM：流式套接字，提供面向连接、可靠的数据传输服务，数据按字节流、按顺序收发，保证在传输过程中无丢失、无冗余。TCP协议支持该套接字。
2. SOCK_DGRAM：数据报套接字，提供面向无连接的服务，数据收发无序，不能保证数据的准确到达。UDP协议支持该套接字。
3. SOCK_RAW：原始套接字。允许对低于传输层的协议或物理网络直接访问，例如可以接收和发送ICMP报文。常用于检测新的协议。

## socket、bind、listen、accept、connect

1、socket

```
//socket()打开一个网络通讯端口，如果成功的话，返回一个文件描述符
//成功返回一个新的文件描述符，失败返回-1，设置errno
#include <sys/types.h> /* See NOTES */
#include <sys/socket.h>
int socket(int domain, int type, int protocol);

/*
domain: 
AF_INET  这是大多数用来产生socket的协议，使用TCP或UDP来传输，用IPv4的地址 
AF_INET6 与上面类似，不过是来用IPv6的地址 
AF_UNIX  本地协议，使用在Unix和Linux系统上，一般都是当客户端和服务器在同一台及其上的时候使用
 
type: 
SOCK_STREAM 这个协议是按照顺序的、可靠的、数据完整的基于字节流的连接。这是一个使用最多的socket类型，这个socket是使用TCP来进行传输。 
SOCK_DGRAM 这个协议是无连接的、固定长度的传输调用。该协议是不可靠的，使用UDP来进行它的连接。 
SOCK_SEQPACKET 这个协议是双线路的、可靠的连接，发送固定长度的数据包进行传输。必须把这个包完整的接受才能进行读取。 
SOCK_RAW 这个socket类型提供单一的网络访问，这个socket类型使用ICMP公共协议。（ping、traceroute使用该协议） 
SOCK_RDM 这个类型是很少使用的，在大部分的操作系统上没有实现，它是提供给数据链路层使用，不保证数据包的顺序
 
protocol: 
0 默认协议
*/
```

2、bind

```
//bind()的作用是将参数sockfd和addr绑定在一起，使sockfd这个用于网络通讯的文件描述符监听addr所描述的地址和端口号。
//成功返回0，失败返回-1, 设置errno
#include <sys/types.h> /* See NOTES */
#include <sys/socket.h>
int bind(int sockfd, const struct sockaddr *addr, socklen_t addrlen);
/*
sockfd： 
socket文件描述符
 
addr: 
构造出IP地址加端口号
 
addrlen: 
sizeof(addr)长度
*/
```

3、listen

```
/*
listen()声明sockfd处于监听状态，并且最多允许有backlog个客户端处于连接待状态，如果接收到更多的连接请求就忽略。
 
查看系统默认backlog
cat /proc/sys/net/ipv4/tcp_max_syn_backlog
 
 
内核为任何一个给定的监听套接字维护两个队列：
（1）未完成连接队列，每个这样的SYN分节对应其中一项：已由某个客户发出并到达服务器，而服务器正在等待完成相应的TCP三路握手过程。这些套接字处于SYN_RECV状态
 
（2）已完成连接队列，每个已完成TCP三路握手过程的客户对应其中一项。这些套接字处于ESTABLISHED状态。
*/
//成功返回0，失败返回-1。
#include <sys/types.h> /* See NOTES */
#include <sys/socket.h>
/*
sockfd: 
socket文件描述符
 
backlog: 
排队建立3次握手队列和刚刚建立3次握手队列的链接数和
*/
```

4、accept

```
//三方握手完成后，服务器调用accept()接受连接，如果服务器调用accept()时还没有客户端的连接请求，就阻塞等待直到有客户端连接上来。
//成功返回一个新的socket文件描述符，用于和客户端通信，失败返回-1，设置errno
#include <sys/types.h> /* See NOTES */
#include <sys/socket.h>
int accept(int sockfd, struct sockaddr *addr, socklen_t *addrlen);
/*
sockdf: 
socket文件描述符
 
addr: 
传出参数，返回链接客户端地址信息，含IP地址和端口号
 
addrlen: 
传入传出参数（值-结果）,传入sizeof(addr)大小，函数返回时返回真正接收到地址结构体的大小
*/
```

5、connect

```
//客户端需要调用connect()连接服务器，connect和bind的参数形式一致，区别在于 bind的参数是自己的地址，而connect的参数是对方的地址。
//成功返回0，失败返回-1，设置errno
#include <sys/types.h> /* See NOTES */
#include <sys/socket.h>
int connect(int sockfd, const struct sockaddr *addr, socklen_t addrlen);
/*
sockdf: 
socket文件描述符
 
addr: 
传入参数，指定服务器端地址信息，含IP地址和端口号
 
addrlen: 
传入参数,传入sizeof(addr)大小
*/
```

## SO_REUSEADDR

> setsockopt（SO_REUSEADDR）用在服务器端，socket()创建之后，bind()之前.
> 所有TCP服务器都应该指定本套接字选项，以防止当套接字处于TIME_WAIT时bind()失败的情形出现

1. SO_REUSEADDR允许启动一个监听服务器并捆绑其端口，即使以前建立的将端口用作他们的本地端口的连接仍旧存在
【即便TIME_WAIT状态存在，服务器bind()也能成功】

2. 允许同一个端口上启动同一个服务器的多个实例，只要每个实例捆绑一个不同的本地IP地址即可

3. SO_REUSEADDR允许单个进程捆绑同一个端口到多个套接字，只要每次捆绑指定不同的本地IP地址即可

4. SO_REUSEADDR允许完全重复的绑定：当一个IP地址和端口已经绑定到某个套接字上时，如果传输协议支持，同样的IP地址和端口还可以绑定到另一个套接字上；一般来说本特性仅支持UDP套接字[TCP不行]

## p2p聊天demo

[p2psvr.c](/assets/src/p2p/p2psvr.c)

[p2pcli.c](/assets/src/p2p/p2pcli.c)
