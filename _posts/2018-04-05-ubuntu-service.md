---
layout: post
title: Ubuntu16.06常见服务搭建
date: 2018-04-05
tags: 博客
---
 
## 摘要
系统环境Ubuntu 16.04 amd64
隔一段时间要配一次服务记不住，记录在这里方便以后安装。
目前更新了以下服务：
- ssh
- samba
- vimrc // 20200126更新

## ssh

### 安装

```
sudo apt-get install openssh-server
```

附个SecureCRT保护眼睛的背景色:
色调(E)：85
饱和度(S)：95
亮度(L)：205
红(R)：204
绿(G)：232
蓝(B)：207
10进制颜色值(RGB)：13625548
16进制颜色值(HEX)：CCE8CF


## samba

### 安装

```
sudo apt-get install samba
```

### 配置

配置前最好备份下smb.conf文件，我这里备份为smb.conf.bk

```
cd /etc/samba
sudo cp smb.conf smb.conf.bk
vi smb.conf
```

配置主要分为以下两个部分：
* 需要共享哪个目录
* 目录权限

直接在smb.conf文件的最后加入如下语句：

```
[pusidun_share]
    comment=My share
    path=/home/pusidun
    writable=yes
    browseable=yes
```

path是想共享的目录，writable和browseable是写权限和读权限
根据自己的配置要求改一下就行。

配置好后要重启服务

```
sudo /etc/init.d/smbd restart
sudo /etc/init.d/nmbd restart
```

### samba的用户权限

我们登陆samba的用户名和linux用户名是共享的，但是之间不共享密码，需要单独为samba账号设置密码。

```
smbpasswd -a pusidun
```

上面这条命令是来设置pusidun这个账号的samba密码的。根据如上所述，这里设置密码的账号也应该是linux系统的账号名。


### windows登陆samba

资源管理器或者win+R运行，输入“\\IP地址”即可连接。

## vimrc

```
# ~/.vimrc
set nocompatible
set encoding=utf-8
set fileencodings=utf-8,chinese
set tabstop=4
set cindent shiftwidth=4
set backspace=indent,eol,start
autocmd Filetype c set omnifunc=ccomplete#Complete
autocmd Filetype cpp set omnifunc=cppcomplete#Complete
set incsearch
set number
set display=lastline
set ignorecase
syntax on
set nobackup
set ruler
set showcmd
set smartindent
set hlsearch
set cmdheight=1
set laststatus=2
set shortmess=atI
set formatoptions=tcrqn
set autoindent  
```

exuberant-ctags这个工具可以为程序语言对象生成索引

`ctags -h=.h.c.S -R`

比较常用的命令：
1. tag tagname 用于跳转到指定的tag
2. ctrl+] 取出当前光标下的word作为tag的名字并进行跳转
3. tags 列出曾经访问过的tag的列表
4. ctrl+T 跳转到前一次的tag处
5. ctrl+w+] 分割当前窗口，并且跳转到光标下的tag
