//粘包解决方案--包头加上包体长度
//服务器
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <errno.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <signal.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
 
typedef struct _packet
{
    int len; //定义包体长度
    char buf[1024]; //定义包体
} Packet;
 
/*
 * fd：文件描述符
 * buf：数据缓存区
 * count：读取字符数
 * */
ssize_t readn(int fd, const void *buf, ssize_t count)
{
    //定义临时指针变量
    char *pbuf = (char *)buf;
    //定义每次已读数据
    ssize_t nread = 0;
    //定义剩余数据
    ssize_t lread = count;
    while (lread > 0)
    {
        nread = read(fd, pbuf, lread);
        /*
         * 情况分析：假设b缓冲区buf足够大
         * 如果nread==count,说明数据正好被读完
         * nread<count，说明数据没有被读完，这种情况就是由于粘包产生的
         * socket只接收了数据的一部分，TCP/IP协议不可能出现丢包情况
         * nread==0，说明对方关闭文件描述符
         * nread==-1，说明read函数报错
         * nread>count，这种情况不可能存在
         * */
        if (nread == -1)
        {
            //read()属于可中断睡眠函数，需要做信号处理
            if (errno == EINTR)
                continue;
            perror("read() err");
            return -1;
        } else if (nread == 0)
        {
            printf("client is closed !\n");
            //返回已经读取的字节数
            return count - lread;
        }
        //重新获取 剩余的 需要读取的 字节数
        lread = lread - nread;
        //指针后移
        pbuf = pbuf + nread;
    }
    return count;
}
 
/* fd：文件描述符
 * buf：数据缓存区
 * count：读取字符数
 * */
ssize_t writen(int fd, const void *buf, ssize_t count)
{
    //定义临时指针变量
    char *pbuf = (char *)buf;
    //每次写入字节数
    ssize_t nwrite = 0;
    //剩余未写字节数
    ssize_t lwrite = count;
    while (lwrite > 0)
    {
        nwrite = write(fd, pbuf, lwrite);
        if (nwrite == -1)
        {
            if (errno == EINTR)
                continue;
            perror("write() err");
            return -1;
        } else if (nwrite == 0)
        {
            printf("client is closed !\n");
            //对方关闭文件描述符，返回已经写完的字节数
            return count - lwrite;
        }
        lwrite -= nwrite;
        pbuf += nwrite;
    }
    return count;
}
 
int main(int arg, char *args[])
{
    //create socket
    int listenfd = socket(AF_INET, SOCK_STREAM, 0);
    if (listenfd == -1)
    {
        perror("socket() err");
        return -1;
    }
    //reuseaddr
    int optval = 1;
    if (setsockopt(listenfd, SOL_SOCKET, SO_REUSEADDR, &optval, sizeof(optval))
            == -1)
    {
        perror("setsockopt() err");
        return -1;
    }
    //bind
    struct sockaddr_in addr;
    addr.sin_family = AF_INET;
    addr.sin_port = htons(8080);
    addr.sin_addr.s_addr = inet_addr("127.0.0.1");
    if (bind(listenfd, (struct sockaddr *) &addr, sizeof(addr)) == -1)
    {
        perror("bind() err");
        return -1;
    }
    //listen
    if(listen(listenfd,SOMAXCONN)==-1)
    {
        perror("listen() err");
        return -1;
    }
    //accept
    struct sockaddr_in peeraddr;
    socklen_t peerlen = sizeof(peeraddr);
    int conn = accept(listenfd, (struct sockaddr *)&peeraddr,&peerlen);
    if (conn == -1)
    {
        perror("accept() err");
        return -1;
    }
    Packet _packet;
    while (1)
    {
        memset(&_packet, 0, sizeof(_packet));
        //获取报文自定义包头
        int rc = readn(conn, &_packet.len, 4);
        if (rc == -1)
        {
            exit(0);
        } else if (rc < 4)
        {
            exit(0);
        }
        //把网络字节序转化成本地字节序
        int n = ntohl(_packet.len);
        //获取报文自定义包体
        rc = readn(conn, _packet.buf, n);
        if (rc == -1)
        {
            exit(0);
        } else if (rc < n)
        {
            exit(0);
        }
        //打印报文数据
        fputs(_packet.buf, stdout);
        //将原来的报文数据发送回去
        printf("发送报文的长度%d\n", 4 + n);
        rc = writen(conn, &_packet, 4 + n);
        if (rc == -1)
        {
            exit(0);
        } else if (rc < 4 + n)
        {
            exit(0);
        }
    }
    return 0;
}