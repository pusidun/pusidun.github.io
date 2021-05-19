---
layout: post
title: socket编程(二)
date: 2021-05-19
tags: Linux
---
<!-- TOC -->

- [流协议与粘包](#流协议与粘包)
  - [产生原因:](#产生原因)
  - [粘包处理方案--本质上是要在应用层维护消息与消息的边界](#粘包处理方案--本质上是要在应用层维护消息与消息的边界)
- [read、write与recv、send](#readwrite与recvsend)
- [getsockname、getpeername](#getsocknamegetpeername)
- [gethostname、gethostbyname、gethostbyaddr](#gethostnamegethostbynamegethostbyaddr)
- [僵进程与SIGCHLD信号](#僵进程与sigchld信号)
  - [wait](#wait)
  - [waitpid](#waitpid)
  - [wait与waitpid区别](#wait与waitpid区别)

<!-- /TOC -->
## 流协议与粘包

**争议**：粘包并非专业术语，该数据包应指应用层的包。常常由于应用层未提供数据边界，而TCP作为流式传输协议，造成客户端无法区分数据包起始所造成的现象。**TCP粘包为绝对的错误说法**，TCP不存在包的概念。

### 产生原因:

1.SQ_SNDBUF套接字本身有缓冲区（发送缓冲区，接收缓冲区）

2.tcp传送的网络数据最大值MSS大小限制

3.链路层也有MTU（最大传输单元）大小限制，如果数据包大于>MTU要在IP层进行分片，导致消息分割。

4.tcp的流量控制和拥塞控制，也可能导致粘包

5.tcp延迟发送机制等等

结论：TCP/IP协议，在传输层没有处理粘包问题，必须由程序员处理

### 粘包处理方案--本质上是要在应用层维护消息与消息的边界

1.定包长

2.包尾加\r\n（比如ftp协议）

3.包头加上包体长度

4.更复杂的应用层协议

例子：定义packet结构体

```
typedef struct _packet
{
    int len; //定义包体长度
    char buf[1024]; //定义包体
} Packet;
```

[readn.c](/assets/src/packet/readn.c)

[writen.c](/assets/src/packet/writen.c)

## read、write与recv、send

```
#include <sys/types.h> 
#include <sys/socket.h>
int recv(int sockfd,void *buf,int len,int flags)
 
int send(int sockfd,void *buf,int len,int flags)

/*
前面的三个参数和read,write相同，第四个参数能够是0或是以下的组合：
 
______________________________________________________________
 
| MSG_DONTROUTE | 不查找路由表 |
 
| MSG_OOB       | 接受或发送带外数据 |
 
| MSG_PEEK      | 查看数据,并不从系统缓冲区移走数据 |
 
| MSG_WAITALL   | 等待任何数据 |
 
|————————————————————–|
 
 
MSG_DONTROUTE:
是send函数使用的标志.这个标志告诉IP协议.目的主机在本地网络上面,没有必要查找路由表.这个标志一般用网络诊断和路由程式里面.
 
MSG_OOB:
表示能够接收和发送带外的数据.关于带外数据我们以后会解释的.
 
MSG_PEEK:
是recv函数的使用标志,表示只是从系统缓冲区中读取内容,而不清楚系统缓冲区的内容.
这样下次读的时候,仍然是相同的内容.一般在有多个进程读写数据时能够使用这个标志.
 
MSG_WAITALL
是recv函数的使用标志,表示等到任何的信息到达时才返回.
使用这个标志的时候recv回一直阻塞,直到指定的条件满足,或是发生了错误.1
*/
```

## getsockname、getpeername

```
//getsockname函数用于获取与某个套接字关联的本地协议地址
//getpeername函数用于获取与某个套接字关联的外地协议地址
//对于这两个函数，如果函数调用成功，则返回0，如果调用出错，则返回-1。
#include<sys/socket.h>
int getsockname(int sockfd, struct sockaddr *localaddr, socklen_t *addrlen);
int getpeername(int sockfd, struct sockaddr *peeraddr, socklen_t *addrlen); 

/*
使用这两个函数，我们可以通过套接字描述符来获取自己的IP地址和连接对端的IP地址，
如在未调用bind函数的TCP客户端程序上，可以通过调用getsockname()函数获取由内核赋予该连接的本地IP地址和本地端口号，
还可以在TCP的服务器端accept成功后，通过getpeername()函数来获取当前连接的客户端的IP地址和端口号。
*/
```

## gethostname、gethostbyname、gethostbyaddr

```
/*
gethostname() ： 返回本地主机的标准主机名。
gethostbyname(): 通过主机名称获取主机的信息
gethostbyaddr(): 通过一个IPv4的地址来获取主机信息

返回值
gethostname()  ： 函数成功，则返回0。如果发生错误则返回-1。错误号存放在外部变量errno中。
gethostbyname(): 返回hostent结构体类型指针 
gethostbyaddr(): 返回hostent结构体类型指针
*/
#include <netdb.h>
#include <unistd.h>
int              gethostname(char *name, size_t len);
struct hostent*  gethostbyname(const char *name);
struct hostent * gethostbyaddr(const char * addr, socklen_t len, int family);

/*
gethostname() ： 
接收缓冲区name，其长度必须为len字节或是更长,存获得的主机名。
接收缓冲区name的最大长度
 
 
gethostbyname(): 
传入值是域名或者主机名，例如"www.google.cn"等等。传出值，是一个hostent的结构。
 
 
gethostbyaddr(): 
addr：指向网络字节顺序地址的指针。
len： 地址的长度，在AF_INET类型地址中为4。
type：地址类型，应为AF_INE
*/
```

## 僵进程与SIGCHLD信号

一个进程执行了exit系统调用退出时会向父进程发送SIGCHLD信号，而其父进程并没有为它收尸(调用wait或waitpid来获得它的结束状态，如进程ID、终止状态等等)的进程。

设置僵死状态的目的是维护子进程的信息，以便父进程在以后某个时候获取。

如何避免僵尸进程：

1、通过signal(SIGCHLD, SIG_IGN)通知内核对子进程的结束不关心，由内核回收。
2、父进程调用wait/waitpid等函数等待子进程结束，如果尚无子进程退出wait会导致父进程阻塞。waitpid可以通过传递WNOHANG使父进程不阻塞立即返回。
3、如果父进程很忙可以用signal注册信号处理函数，在信号处理函数调用wait/waitpid等待子进程退出。
4、通过两次调用fork。父进程首先调用fork创建一个子进程然后waitpid等待子进程退出，子进程再fork一个孙进程后退出。这样子进程退出后会被父进程等待回收，而对于孙子进程其父进程已经退出所以孙进程成为一个孤儿进程，孤儿进程由init进程接管，孙进程结束后，init会等待回收。

### wait

```
//成功，wait会返回被收集的子进程的进程ID，如果调用进程没有子进程，调用就会失败，此时wait返回-1，同时errno被置为ECHIL
#include <sys/types.h> 
#include <sys/wait.h>
pid_t wait(int *status);

/*
进程一旦调用了wait，就立即阻塞自己.
wait系统调用会使父进程暂停执行，直到它的一个子进程结束为止。
返回的是子进程的PID，它通常是结束的子进程
状态信息允许父进程判定子进程的退出状态，即从子进程的main函数返回的值或子进程中exit语句的退出码。
如果status不是一个空指针，状态信息将被写入它指向的位置
*/
```

### waitpid

```
//返回值：如果成功返回等待子进程的ID，失败返回-1
#include <sys/types.h> 
#include <sys/wait.h>
pid_t waitpid(pid_t pid, int *status, int options);
/*
status:如果不是空，会把状态信息写到它指向的位置，与wait一样

options：允许改变waitpid的行为，最有用的一个选项是WNOHANG,它的作用是防止waitpid把调用者的执行挂起
 
----------------------------------------------------------------------------
|-对于waitpid的p i d参数的解释与其值有关：
|-
|-pid == -1 等待任一子进程。于是在这一功能方面waitpid与wait等效。
|-
|-pid > 0 等待其进程I D与p i d相等的子进程。
|-
|-pid == 0 等待其组I D等于调用进程的组I D的任一子进程。换句话说是与调用者进程同在一个组的进程。
|-
|-pid < -1 等待其组I D等于p i d的绝对值的任一子进程
----------------------------------------------------------------------------
*/
```

### wait与waitpid区别

在一个子进程终止前， wait 使其调用者阻塞，而waitpid 有一选择项，可使调用者不阻塞。

waitpid并不等待第一个终止的子进程—它有若干个选择项，可以控制它所等待的特定进程。

实际上wait函数是waitpid函数的一个特例。waitpid(-1, &status, 0);

