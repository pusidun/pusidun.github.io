---
layout: post
title: select/poll/epoll
date: 2021-05-20
tags: 大并发服务器开发
---
<!-- TOC -->

- [select](#select)
  - [API](#api)
  - [socket何时可读写](#socket何时可读写)
- [poll](#poll)
  - [API](#api-1)
  - [poll使用案例](#poll使用案例)
- [epoll](#epoll)
  - [API](#api-2)
  - [epoll LT例子](#epoll-lt例子)

<!-- /TOC -->
## select

### API

```
/*
@作用：在一定时间内，监听用户感兴趣的文件描述符上的可读可写和异常事件

@返回值：

成功时返回就绪文件描述符总数。

失败时返回-1并设置errno。如果再select等待期间程序收到信号，select立即返回-1，并设置errno为EINTR

@说明：

nfds:监听的文件描述符总数，等于最大文件描述符值+1
fd_set:结构体，操作
    FD_ZERO(fd_set* fdset);
    FD_SET(int fd, fd_set* fdset);
    FD_CLR(int fd, fd_set* fdset);
    int FD_ISSET(int fd, fd_set* fdset);
timeout:
    struct timeval{
        long tv_sec;
        long tv_usec;
    };
*/
#include<sys/select.h>
int select(int nfds, fd_set* readfds, fd_set* writefds, fd_set* exceptfds,
            struct timeval* timeout);
```

### socket何时可读写

- 以下情况socket可读

1. socket内核接受缓冲区中的字节数大于等于低水位标记SO_RCVLOWAT
2. socket通信对方关闭连接。此时读操作返回0
3. 监听socket上有新的连接请求
4. socket上有未处理的错误。此时我们可以使用getsockopt来读取和清除错误

- 以下情况socket可写

1. socket内核发送缓冲区的可用字节数大于或等于低水位标记SO_SNDLOWAT
2. socket写操作被关闭。对写操作被关闭的socket执行写操作或触发SIGPIPE
3. socket使用非阻塞connect连接成功或者失败（超时）之后
4. socket上有未处理的错误。此时我们可以使用getsockopt来读取和清除错误

## poll

### API

```
/*
@作用：把当前的文件指针挂到等待队列 (多路检测可用套接字)

@返回值：
成功时，poll()返回结构体中revents域不为0的文件描述符个数；
如果在超时前没有任何事件发生，poll()返回0；
 
失败时，poll()返回-1，并设置errno为下列值之一：
    EBADF：一个或多个结构体中指定的文件描述符无效。
　　EFAULT：fds指针指向的地址超出进程的地址空间。
　　EINTR：请求的事件之前产生一个信号，调用可以重新发起。
　　EINVAL：nfds参数超出PLIMIT_NOFILE值。
　　ENOMEM：可用内存不足，无法完成请求。
*/
#include<poll.h>
int poll(struct pollfd fd[], nfds_t nfds, int timeout);

/*
struct pollfd的结构如下：
 
struct pollfd{
 
　int fd； // 文件描述符
 
　short event；// 请求的事件
 
　short revent；// 返回的事件
 
}
每个pollfd结构体指定了一个被监视的文件描述符。
 
每个结构体的events是监视该文件描述符的事件掩码，由用户来设置。
revents是文件描述符的操作结果事件，内核在调用返回时设置。
events中请求的任何事件都可能在revents中返回。

第一个参数是一个数组，即poll函数可以监视多个文件描述符。
第二个参数nfds：要监视的描述符的数目。
第三个参数timeout: 指定等待的毫秒数，无论I/O是否准备好，poll都会返回。
                   timeout指定为负数值表示无限超时；
                   timeout为0指示poll调用立即返回并列出准备好I/O的文件描述符，但并不等待其它的事件。这种情况下，poll()就像它的名字那样，一旦选举出来，立即返回。
*/
```

### poll使用案例

```
#include <unistd.h>
#include <sys/types.h>
#include <fcntl.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <signal.h>
#include <sys/wait.h>
#include <poll.h>
 
#include <stdlib.h>
#include <stdio.h>
#include <errno.h>
#include <string.h>
 
#include <vector>
#include <iostream>
 
#define ERR_EXIT(m) \
        do \
        { \
                perror(m); \
                exit(EXIT_FAILURE); \
        } while(0)
 
 
typedef std::vector<struct pollfd> PollFdList;
 
int main(void)
{
	signal(SIGPIPE, SIG_IGN);
	signal(SIGCHLD, SIG_IGN); //避免僵死进程
 
	
	int listenfd;
 
    //监听套接字                                     //非阻塞
	if ((listenfd = socket(PF_INET, SOCK_STREAM | SOCK_NONBLOCK | SOCK_CLOEXEC, IPPROTO_TCP)) < 0)
		ERR_EXIT("socket");
 
 
    //填充地址相关
	struct sockaddr_in servaddr;
	memset(&servaddr, 0, sizeof(servaddr));
	servaddr.sin_family = AF_INET;
	servaddr.sin_port = htons(5188);
	servaddr.sin_addr.s_addr = htonl(INADDR_ANY);
 
	int on = 1;
	//设置地址的重复利用
	if (setsockopt(listenfd, SOL_SOCKET, SO_REUSEADDR, &on, sizeof(on)) < 0)
		ERR_EXIT("setsockopt");
 
    //绑定
	if (bind(listenfd, (struct sockaddr*)&servaddr, sizeof(servaddr)) < 0)
		ERR_EXIT("bind");
	//监听
	if (listen(listenfd, SOMAXCONN) < 0)
		ERR_EXIT("listen");
 
 
    //========================poll的使用=======================//
	struct pollfd pfd;
	pfd.fd = listenfd;
	pfd.events = POLLIN;  //关注POLLIN（读）事件
 
	PollFdList pollfds;   //pollfd队列
	pollfds.push_back(pfd);
 
	int nready;  //待处理的事件数
 
	struct sockaddr_in peeraddr;
	socklen_t peerlen;
	int connfd;
 
	while (1)
	{
		nready = poll(&*pollfds.begin(), pollfds.size(), -1); //无限超时等待
		if (nready == -1)
		{
			if (errno == EINTR)
				continue;
			
			ERR_EXIT("poll");
		}
		if (nready == 0)	// nothing happended
			continue;
		
		if (pollfds[0].revents & POLLIN) //判断是否有POLLIN事件到来
		{
			peerlen = sizeof(peeraddr);
			connfd = accept4(listenfd, (struct sockaddr*)&peeraddr,
						&peerlen, SOCK_NONBLOCK | SOCK_CLOEXEC); //非阻塞的  CLOEXEC标记的
 
			if (connfd == -1)
				ERR_EXIT("accept4");
 
 
		{
					
            //把得到的已连接的套接字加入监听队列
			pfd.fd = connfd;
			pfd.events = POLLIN;
			pfd.revents = 0;
			pollfds.push_back(pfd);
			--nready;
 
			//连接成功
			std::cout<<"ip="<<inet_ntoa(peeraddr.sin_addr)<<
				" port="<<ntohs(peeraddr.sin_port)<<std::endl;
				
			//说明事件都处理完了	
			if (nready == 0) 
				continue;
		}
 
	    //遍历已连接字套接字子集
		for (PollFdList::iterator it=pollfds.begin()+1; //第一个套接字总是监听套接字
			it != pollfds.end() && nready >0; ++it)
		{
				if (it->revents & POLLIN) //具有可读事件
				{
					--nready; //处理一个事件，待处理事件数减一
 
					connfd = it->fd;
					char buf[1024] = {0};
					int ret = read(connfd, buf, 1024);
					if (ret == -1)
						ERR_EXIT("read");
					if (ret == 0) //对方关闭了套接字
					{
						std::cout<<"client close"<<std::endl;
						it = pollfds.erase(it); //移除
						--it;
 
						close(connfd);
						continue;
					}
 
					std::cout<<buf;
					write(connfd, buf, strlen(buf));
					
				}
		}
	}
 
	return 0;
}
```

## epoll

### API

epoll_create
```
/*
@作用：创建一个epoll的句柄

@返回：调用成功时返回一个epoll句柄描述符，失败时返回-1。

@说明：
size
表明内核要监听的描述符数量 自从Linux 2.6.8开始，size参数被忽略，但是依然要大于0。
 
 
flags：
0:             如果这个参数是0，这个函数等价于poll_create（0）
EPOLL_CLOEXEC：这是这个参数唯一的有效值，如果这个参数设置为这个。
               那么当进程替换映像的时候会关闭这个文件描述符，
               这样新的映像中就无法对这个文件描述符操作，适用于多进程编程+映像替换的环境里
*/
#include <sys/epoll.h>
int epoll_create(int size);
int epoll_create1(int flags);
```

epoll_ctl
```
/*
@作用：操作一个多路复用的文件描述符

@返回：success：0   error：-1 errno被设置

@说明：
epfd：epoll_create1的返回值
 
op：要执行的命令
EPOLL_CTL_ADD：向多路复用实例加入一个连接socket的文件描述符
EPOLL_CTL_MOD：改变多路复用实例中的一个socket的文件描述符的触发事件
EPOLL_CTL_DEL：移除多路复用实例中的一个socket的文件描述符
 
fd：要操作的socket的文件描述符
 
event：
typedef union epoll_data {
               void        *ptr;
               int          fd;
               uint32_t     u32;
               uint64_t     u64;
           } epoll_data_t;
 
struct epoll_event {
               uint32_t     events;      /* Epoll events */
               epoll_data_t data;        /* User data variable */
};
events可以是下列命令的任意按位与
EPOLLIN： 对应的文件描述有可以读取的内容
EPOLLOUT：对应的文件描述符有可以写入
EPOLLRDHUP：写到一半的时候连接断开
EPOLLPRI：发生异常情况，比如所tcp连接中收到了带外消息
EPOLLET： 设置多路复用实例的文件描述符的事件触发机制为边沿触发，默认为水平触发
1、当多路复用的实例中注册了一个管道，并且设置了触发事件EPOLLIN，
2、管道对端的写入2kb的数据，
3、epoll_wait收到了一个可读事件，并向上层抛出，这个文件描述符
4、调用者调用read读取了1kb的数据，
5、再次调用epoll_wait
 
 
边沿触发：上面的调用结束后，在输入缓存区中还有1kb的数据没有读取，但是epoll_wait将不会再抛出文件描述符。这就导致接受数据不全，对端得不到回应，可能会阻塞或者自己关闭
因为边沿触发的模式下，只有改变多路复用实例中某个文件描述符的状态，才会抛出事件。
相当于，边沿触发方式，内核只会在第一次通知调用者，不管对这个文件描述符做了怎么样的操作
 
水平触发：
只要文件描述符处于可操作状态，每次调用epoll_wait，内核都会通知你
 
EPOLLONESHOT：epoll_wait只会对该文件描述符第一个到达的事件有反应，之后的其他事件都不向调用者抛出。需要调用epoll_ctl函数，对它的事件掩码重新设置
EPOLLWAKEUP
EPOLLEXCLUSIVE
*/
#include <sys/epoll.h>
int epoll_ctl(int epfd, int op, int fd, struct epoll_event *event);
```

epoll_wait
```
/*
@作用：等待一个epoll队列中的文件描述符的I/O事件发生

@返回：>=0，表示准备就绪的文件描述符个数      -1：出错，errno被设置

@说明：
epfd：目标epoll队列的描述符
events：用于放置epoll队列中准备就绪（被触发）的事件
maxevents：最大事件？
timeout：指定函数等待的时间。这个函数阻塞这么长一段时间之后接触阻塞。

#include <sys/epoll.h>
int epoll_wait(int epfd, struct epoll_event *events,int maxevents, int timeout);
```

### epoll LT例子

```
#include <unistd.h>
#include <sys/types.h>
#include <fcntl.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <signal.h>
#include <fcntl.h>
#include <sys/wait.h>
#include <sys/epoll.h>
 
#include <stdlib.h>
#include <stdio.h>
#include <errno.h>
#include <string.h>
 
#include <vector>
#include <algorithm>
#include <iostream>
 
typedef std::vector<struct epoll_event> EventList;
 
#define ERR_EXIT(m) \
        do \
        { \
                perror(m); \
                exit(EXIT_FAILURE); \
        } while(0)
 
int main(void)
{
	signal(SIGPIPE, SIG_IGN);
	signal(SIGCHLD, SIG_IGN);
 
	int idlefd = open("/dev/null", O_RDONLY | O_CLOEXEC);
	int listenfd;
	//if ((listenfd = socket(PF_INET, SOCK_STREAM, IPPROTO_TCP)) < 0)
	if ((listenfd = socket(PF_INET, SOCK_STREAM | SOCK_NONBLOCK | SOCK_CLOEXEC, IPPROTO_TCP)) < 0)
		ERR_EXIT("socket");
 
	struct sockaddr_in servaddr;
	memset(&servaddr, 0, sizeof(servaddr));
	servaddr.sin_family = AF_INET;
	servaddr.sin_port = htons(5188);
	servaddr.sin_addr.s_addr = htonl(INADDR_ANY);
 
	int on = 1;
	if (setsockopt(listenfd, SOL_SOCKET, SO_REUSEADDR, &on, sizeof(on)) < 0)
		ERR_EXIT("setsockopt");
 
	if (bind(listenfd, (struct sockaddr*)&servaddr, sizeof(servaddr)) < 0)
		ERR_EXIT("bind");
	if (listen(listenfd, SOMAXCONN) < 0)
		ERR_EXIT("listen");
 
 
 
    
	//===========================================epoll用法==============================================//
	std::vector<int> clients;
	int epollfd;
	epollfd = epoll_create1(EPOLL_CLOEXEC);
 
	struct epoll_event event;
	event.data.fd = listenfd; //加入监听套接字
	event.events = EPOLLIN    //关注它的可读事件，默认的触发模式是LT模式         /* | EPOLLET*/;
 
	//添加关注事件和监听套接字到epollfd
	epoll_ctl(epollfd, EPOLL_CTL_ADD, listenfd, &event);
	
	EventList events(16); //事件列表
 
	struct sockaddr_in peeraddr;
	socklen_t peerlen;
	int connfd;
 
	int nready;
	while (1)
	{
 
		nready = epoll_wait(epollfd, &*events.begin(), static_cast<int>(events.size()), -1); //-1设置为超时等待
		if (nready == -1)
		{
			if (errno == EINTR)
				continue;
			
			ERR_EXIT("epoll_wait");
		}
		//无事件发生
		if (nready == 0)	// nothing happended
			continue;
 
        //事件列表满了 倍增
		if ((size_t)nready == events.size())
			events.resize(events.size()*2);
 
        //统一处理事件（监听和已连接）
		for (int i = 0; i < nready; ++i)
		{
			//处理监听套接字
			if (events[i].data.fd == listenfd)
			{
				peerlen = sizeof(peeraddr);
				connfd = ::accept4(listenfd, (struct sockaddr*)&peeraddr,
						&peerlen, SOCK_NONBLOCK | SOCK_CLOEXEC); //非阻塞  closeexec
 
                //错误处理
				if (connfd == -1)
				{
					if (errno == EMFILE)
					{
						close(idlefd);
						idlefd = accept(listenfd, NULL, NULL);
						close(idlefd);
						idlefd = open("/dev/null", O_RDONLY | O_CLOEXEC);
						continue;
					}
					else
						ERR_EXIT("accept4");
				}
 
 
				std::cout<<"ip="<<inet_ntoa(peeraddr.sin_addr)<<
					" port="<<ntohs(peeraddr.sin_port)<<std::endl;
                      
				clients.push_back(connfd);
				
				//将该文件描述符加入关注 
				event.data.fd = connfd;
				event.events = EPOLLIN; //电平触发     /* | EPOLLET*/
				epoll_ctl(epollfd, EPOLL_CTL_ADD, connfd, &event);
			}
			//处理已连接套接字（都是活跃的套接字）
			else if (events[i].events & EPOLLIN)
			{
				connfd = events[i].data.fd;
				if (connfd < 0)
					continue;
 
				char buf[1024] = {0};
				int ret = read(connfd, buf, 1024);
				if (ret == -1)
					ERR_EXIT("read");
				if (ret == 0) //对方关闭
				{
					std::cout<<"client close"<<std::endl;
					close(connfd);
					event = events[i];
					epoll_ctl(epollfd, EPOLL_CTL_DEL, connfd, &event);
					clients.erase(std::remove(clients.begin(), clients.end(), connfd), clients.end());
					continue;
				}
 
				std::cout<<buf;
				write(connfd, buf, strlen(buf));
			}
 
		}
	}
 
	return 0;
}
```