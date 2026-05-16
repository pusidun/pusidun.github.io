//粘包解决方案--包头加上包体长度
//客户端
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
    int sockfd = socket(AF_INET, SOCK_STREAM, 0);
    if (sockfd == -1)
    {
        perror("socket() err");
        return -1;
    }
    //connect
    struct sockaddr_in addr;
    addr.sin_family = AF_INET;
    addr.sin_port = htons(8080);
    addr.sin_addr.s_addr = inet_addr("127.0.0.1");
    if (connect(sockfd, (struct sockaddr *) &addr, sizeof(addr)) == -1)
    {
        perror("connect() err");
        return -1;
    }
    int rc = 0, numx = 0;
    Packet _packet;
    memset(&_packet, 0, sizeof(_packet));
    while (fgets(_packet.buf, sizeof(_packet.buf), stdin) != NULL)
    {
        //发送数据
        numx = strlen(_packet.buf);
        //将本地字节转化成网络字节序
        _packet.len = htonl(numx);
        rc = writen(sockfd, &_packet, 4 + numx);
        if (rc == -1)
        {
            return -1;
        } else if (rc < 4 + numx)
        {
            return -1;
        }
        //接收数据
        memset(&_packet, 0, sizeof(_packet));
        //获取包头
        rc = readn(sockfd, &_packet.len, 4);
        if (rc == -1)
        {
            return -1;
        } else if (rc < 4)
        {
            return -1;
        }
        //将网络字节转化成本地字节
        numx = ntohl(_packet.len);
        //printf("接收数据的大小是%d\n",numx);
        //获取包体
        rc = readn(sockfd, &_packet.buf, numx);
        if (rc == -1)
        {
            return -1;
        } else if (rc < numx)
        {
            return -1;
        }
        //打印包体
        fputs(_packet.buf,stdout);
        memset(&_packet, 0, sizeof(_packet));
    }
    return 0;
}