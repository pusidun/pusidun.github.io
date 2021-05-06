---
layout: post
title: 【The Linux programming interface】File I/O
date: 2021-04-09
tags: Linux
---

>本篇总结自<<The Linux programming interface a Linux and UNIX system programming handbook by Michael Kerrisk>> ch4,ch5

## 四个基本IO系统调用

### 简介

```
#include<unistd.h>
STDIN_FILENO    0
STDOUT_FILENO   1
STDERR_FILENO   2

4 system call:
fd = open(pathname,flags,mod)
numread = read(fd, buffer, count)
numwritten = write(fd, buffer, count)
status = close(fd)
```

例子copy.c:
```
#include <unistd.h>
#include <fcntl.h>

// copy oldfile newfile
int main(int argc, char* argv[]) {
    char buff[1024];
    int input_fd, output_fd;
    if(argc < 3){
        return -1;
    }
    
    input_fd = open(argv[1], O_RDONLY);
    if(input_fd == -1)
        return -1;
    
    mode_t filePerms = S_IRUSR|S_IWUSR|S_IRGRP|S_IWGRP|S_IROTH|S_IWOTH;
    output_fd = open(argv[2], O_WRONLY|O_CREAT|O_TRUNC, filePerms);
    if(output_fd == -1)
        return -1;

    int numRead = 0;
    while((numRead = read(input_fd, buff, sizeof(buff))) > 0)
        if(write(output_fd, buff, numRead) == -1)
            return -1;
    if(numRead == -1)
        return -1;

    if(close(input_fd) == -1)
        return -1;
    if(close(output_fd) == -1)
        return -1;
    return 0;
}
```

### open

```
#include<sys/stat.h>
#include<fcntl.h>
int open(const char *pathname, int flags, .../* mod_t mode */);
// returns file desc on success, or -1 on error
```

flags划分为三类
- File access mode flags：fcntl F_GETFL可以得到
- File creation flags：不能被修改或者读取
- Open file status flags：fcntl F_GETFL可以得到，F_SETFL设置

![LinuxProgrammingInterface-FIO-001](/assets/images/LinuxProgrammingInterface-FIO-001.jpg)

### read

### write

### close
