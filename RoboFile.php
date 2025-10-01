<?php
/**
 * This is project's console commands configuration for Robo task runner.
 *
 * @see https://robo.li/
 */
class RoboFile extends \Robo\Tasks
{
    // Define public methods as commands

    public function buildWeb()
    {
        $this->taskExecStack()
            ->exec('cd ./frontend && npm run build')
            ->run();
    }

    public function buildApi()
    {
        $this->taskExecStack()
            ->exec('cd ./backend && npm run build')
            ->run();
    }

    public function buildAppOnly()
    {
        // 清空 ./electron/resources 目录
        $this->taskDeleteDir('./electron/resources')
            ->run();

        // 将后端构建的文件复制到 electron 目录下
        $this->recursiveCopy('./backend/dist', './electron/resources');

        // 将前端构建的文件复制到 electron 目录下
        $this->recursiveCopy('./frontend/dist', './electron/resources/site');

        // 安装 Node.js 依赖
        $this->taskExecStack()
            ->exec('cd ./electron/resources && npm install')
            ->run();
    }

    function  prepairApp()
    {
        $this->buildWeb();
        $this->buildApi();

        // 先清空 ./electron/resources 目录
        $this->taskDeleteDir('./electron/resources')
            ->run();

        // 将后端构建的文件复制到 electron 目录下
        $this->recursiveCopy('./backend/dist', './electron/resources');

        // 将前端构建的文件复制到 electron 目录下
        $this->recursiveCopy('./frontend/dist', './electron/resources/site');
    }

    public function buildApp()
    {
        $this->prepairApp();

        // 安装 Node.js 依赖并打包应用
        $this->taskExecStack()
            ->exec('cd ./electron/resources && npm install && cd .. && npm run package')
            ->run();
    }

    public function buildApp86()
    {
        $this->prepairApp();

        // 安装 Node.js 依赖并打包应用
        $this->taskExecStack()
            ->exec('cd ./electron/resources && npm install && cd .. && npm run package86')
            ->run();

    }

    public function buildAppUni()
    {
        $this->prepairApp();

        // 安装 Node.js 依赖并打包应用
        $this->taskExecStack()
            ->exec('cd ./electron/resources && npm install && cd .. && npm run packageuni')
            ->run();

    }

    public function buildDocker()
    {
        $this->buildWeb();
        $this->buildApi();

        // 清空 ./docker/app 目录
        $this->taskDeleteDir('./docker/app')
            ->run();

        // 将后端源码复制到 docker/app 目录下（排除 node_modules 和 dist）
        $this->recursiveCopy('./backend', './docker/app/backend', ['node_modules', 'dist']);

        // 将前端源码复制到 docker/app 目录下（排除 node_modules 和 dist）
        $this->recursiveCopy('./frontend', './docker/app/frontend', ['node_modules', 'dist']);

        // 构建 Docker 镜像
        $this->taskExecStack()
            ->exec('cd ./docker && docker build -t aideer:latest .')
            ->run();
    }

    public function publishDocker($tag = 'latest')
    {
        $this->buildDocker();

        // 标记镜像并推送到 Docker Hub
        $this->taskExecStack()
            ->exec("docker tag aideer:$tag easychen/aideer:$tag")
            ->exec("docker push easychen/aideer:$tag")
            ->run();
    }

    protected function recursiveCopy($src, $dst, $excludeDirs = [])
    {
        if (!is_dir($src)) {
            // nothing to copy
            return;
        }
        if (!file_exists($dst)) {
            if (!mkdir($dst, 0777, true) && !is_dir($dst)) {
                throw new \RuntimeException(sprintf('Directory "%s" was not created', $dst));
            }
        }
        $dir = opendir($src);
        if ($dir === false) {
            return;
        }
        while (false !== ($file = readdir($dir))) {
            if ($file === '.' || $file === '..') {
                continue;
            }
            
            // Skip excluded directories
            if (in_array($file, $excludeDirs)) {
                continue;
            }
            
            $srcPath = rtrim($src, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $file;
            $dstPath = rtrim($dst, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $file;
            if (is_dir($srcPath)) {
                $this->recursiveCopy($srcPath, $dstPath, $excludeDirs);
            } else {
                if (!copy($srcPath, $dstPath)) {
                    throw new \RuntimeException(sprintf('Failed to copy "%s" to "%s"', $srcPath, $dstPath));
                }
            }
        }
        closedir($dir);
    }
}
