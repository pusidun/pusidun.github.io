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

#define ERR_EXIT(m)         \
	do                      \
	{                       \
		perror(m);          \
		exit(EXIT_FAILURE); \
	} while (0)

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
	if (bind(listenfd, (struct sockaddr *)&servaddr, sizeof(servaddr)) < 0)
		ERR_EXIT("bind");
	//监听
	if (listen(listenfd, SOMAXCONN) < 0)
		ERR_EXIT("listen");

	//========================poll的使用=======================//
	struct pollfd pfd;
	pfd.fd = listenfd;
	pfd.events = POLLIN; //关注POLLIN（读）事件

	PollFdList pollfds; //pollfd队列
	pollfds.push_back(pfd);

	int nready; //待处理的事件数

	struct sockaddr_in peeraddr;
	socklen_t peerlen;
	int connfd,idlefd;
	idlefd = open("/dev/null", O_RDONLY | O_CLOEXEC);
	while (1)
	{
		nready = poll(pollfds.data(), pollfds.size(), -1); //无限超时等待
		if (nready == -1)
		{
			if (errno == EINTR)
				continue;

			ERR_EXIT("poll");
		}
		if (nready == 0) // nothing happended
			continue;

		if (pollfds[0].revents & POLLIN) //判断是否有POLLIN事件到来
		{
			peerlen = sizeof(peeraddr);
			connfd = accept4(listenfd, (struct sockaddr *)&peeraddr,
							 &peerlen, SOCK_NONBLOCK | SOCK_CLOEXEC); //非阻塞的  CLOEXEC标记的

			if (connfd == -1)
			{
				if(errno == EMFILE)
				{
					close(idlefd);
					idlefd = accept(listenfd, NULL, NULL);
					close(idlefd);
					idlefd = open("/dev/null", O_RDONLY | O_CLOEXEC);
					continue;
				}
				ERR_EXIT("accept4");
			}

			//把得到的已连接的套接字加入监听队列
			pfd.fd = connfd;
			pfd.events = POLLIN;
			pfd.revents = 0;
			pollfds.push_back(pfd);
			--nready;

			//连接成功
			std::cout << "ip=" << inet_ntoa(peeraddr.sin_addr) << " port=" << ntohs(peeraddr.sin_port) << std::endl;

			//说明事件都处理完了
			if (nready == 0)
				continue;
		}

		//遍历已连接字套接字子集
		for (PollFdList::iterator it = pollfds.begin() + 1; //第一个套接字总是监听套接字
			 it != pollfds.end() && nready > 0; ++it)
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
					std::cout << "client close" << std::endl;
					it = pollfds.erase(it); //移除
					--it;

					close(connfd);
					continue;
				}

				std::cout << buf;
				write(connfd, buf, strlen(buf));
			}
		}
	}
	return 0;
}