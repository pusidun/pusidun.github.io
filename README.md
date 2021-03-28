### Introduce

[![Build Status](https://travis-ci.org/pusidun/pusidun.github.io.svg?branch=master)](https://travis-ci.org/pusidun/pusidun.github.io)

pusidun's blog. Rebuild by Jekyll in 2020.

### Install 

#### npm
npm uninstall

```
#apt-get 卸载
sudo apt-get remove --purge npm
sudo apt-get remove --purge nodejs
sudo apt-get remove --purge nodejs-legacy
sudo apt-get autoremove	
```

npm install[neweast](https://github.com/nodesource/distributions/blob/master/README.md#deb)

Node.js v15.x:
```
# Using Ubuntu
curl -fsSL https://deb.nodesource.com/setup_15.x | sudo -E bash -
sudo apt-get install -y nodejs

# Using Debian, as root
curl -fsSL https://deb.nodesource.com/setup_15.x | bash -
apt-get install -y nodejs
```

sudo npm config set registry https://registry.npm.taobao.org

#### hexo

```
sudo npm install hexo-cli -g
hexo init <folder>
cd folder
npm install
```

### Deployment

#### Jekyll

```
$ jekyll build
# => 当前文件夹中的内容将会生成到 ./_site 文件夹中。

$ jekyll build --destination <destination>
# => 当前文件夹中的内容将会生成到目标文件夹<destination>中。

$ jekyll build --source <source> --destination <destination>
# => 指定源文件夹<source>中的内容将会生成到目标文件夹<destination>中。

$ jekyll build --watch
# => 当前文件夹中的内容将会生成到 ./_site 文件夹中，
#    查看改变，并且自动再生成。

$ jekyll serve
# => 一个开发服务器将会运行在 http://localhost:4000/
# Auto-regeneration（自动再生成文件）: 开启。使用 `--no-watch` 来关闭。

$ jekyll serve --detach
# => 功能和`jekyll serve`命令相同，但是会脱离终端在后台运行。
#    如果你想关闭服务器，可以使用`kill -9 1234`命令，"1234" 是进程号（PID）。
#    如果你找不到进程号，那么就用`ps aux | grep jekyll`命令来查看，然后关闭服务器。[更多](http://unixhelp.ed.ac.uk/shell/jobz5.html).
```

#### hexo

```
hexo clean
hexo generate
hexo deploy
```

```
hexo new "postName"
hexo new page "postName"
hexo generate
hexo server
hexo help
hexo version
```

#### 感谢

本博客在[leopardpan](https://github.com/leopardpan/leopardpan.github.io)基础上修改的。