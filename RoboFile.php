<?php
/**
 * This is project's console commands configuration for Robo task runner.
 *
 * @see https://robo.li/
 */
class RoboFile extends \Robo\Tasks
{
    // define public methods as commands
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
        // 将后端构建的文件复制到 electron 目录下
        $this->_exec('cp -r ./backend/dist/* ./electron/resources');

        // 将前端构建的文件复制到 electron 目录下
        $this->_exec('cp -r ./frontend/dist ./electron/resources/site');

        // 构建 node_modules 依赖
        $this->_exec('cd ./electron/resources && npm install');
    }

    public function buildApp()
    {
        $this->buildWeb();
        $this->buildApi();

        // 先清空
        $this->_exec('rm -rf ./electron/resources/*');
        // 将后端构建的文件复制到 electron 目录下
        $this->_exec('cp -r ./backend/dist/* ./electron/resources');

        // 将前端构建的文件复制到 electron 目录下
        $this->_exec('cp -r ./frontend/dist ./electron/resources/site');

        // 构建 node_modules 依赖
        $this->_exec('cd ./electron/resources && npm install && cd .. && npm run package');
    }
}