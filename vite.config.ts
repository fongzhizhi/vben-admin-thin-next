import type { UserConfig, ConfigEnv } from 'vite';
import pkg from './package.json';
import moment from 'moment';
import { loadEnv } from 'vite';
import { resolve } from 'path';
import { generateModifyVars } from './build/generate/generateModifyVars';
import { createProxy } from './build/vite/proxy';
import { wrapperEnv } from './build/utils';
import { createVitePlugins } from './build/vite/plugin';
import { OUTPUT_DIR } from './build/constant';

function pathResolve(dir: string) {
  return resolve(process.cwd(), '.', dir);
}

const { dependencies, devDependencies, name, version } = pkg;
const __APP_INFO__ = {
  pkg: { dependencies, devDependencies, name, version },
  lastBuildTime: moment().format('YYYY-MM-DD HH:mm:ss'),
};

export default ({ command, mode }: ConfigEnv): UserConfig => {
  // mode => 模式: decelopment | production
  const root = process.cwd();
  // 加载配置信息键值对
  const env = loadEnv(mode, root);

  // 配置信息包装
  const viteEnv = wrapperEnv(env);

  const { VITE_PORT, VITE_PUBLIC_PATH, VITE_PROXY, VITE_DROP_CONSOLE } = viteEnv;

  const isBuild = command === 'build'; // 编译场景：build | serve

  return {
    // 公共基础路径
    base: VITE_PUBLIC_PATH,
    // 文件根目录，用于查找入口文件(默认index.html)
    root,
    // 模块相关
    resolve: {
      // 模块路径别名[同tsconfig.json的paths]
      alias: [
        {
          find: 'vue-i18n',
          replacement: 'vue-i18n/dist/vue-i18n.cjs.js',
        },
        // /@/xxxx => src/xxxx
        {
          find: /\/@\//,
          replacement: pathResolve('src') + '/',
        },
        // /#/xxxx => types/xxxx
        {
          find: /\/#\//,
          replacement: pathResolve('types') + '/',
        },
      ],
    },
    // 服务器相关
    server: {
      // Listening on all local IPs
      host: true,
      // 端口地址
      port: VITE_PORT,
      // 代理配置
      proxy: createProxy(VITE_PROXY),
      // 热更新
      // hmr: false,
    },
    // 打包构建相关
    build: {
      target: 'es2015',
      // 构建目录（为啥不用.env文件配置）
      outDir: OUTPUT_DIR,
      // 代码压缩方式
      minify: 'terser',
      // terser配置
      terserOptions: {
        compress: {
          keep_infinity: true,
          // Used to delete console in production environment
          drop_console: VITE_DROP_CONSOLE,
        },
      },
      // 压缩大小报告(禁用可提升大型项目打包效率)
      brotliSize: false,
      // chunk大小警告，默认500kbs
      chunkSizeWarningLimit: 2000,
    },
    // 定义全局常量替换方式
    define: {
      // setting vue-i18-next
      __VUE_I18N_FULL_INSTALL__: true,
      __VUE_I18N_LEGACY_API__: true,
      __INTLIFY_PROD_DEVTOOLS__: false,
      __APP_INFO__: JSON.stringify(__APP_INFO__),
    },
    // css相关
    css: {
      // css预处理配置
      preprocessorOptions: {
        less: {
          // css全局变量
          modifyVars: generateModifyVars(),
          javascriptEnabled: true,
        },
      },
    },

    // The vite plugin used by the project. The quantity is large, so it is separately extracted and managed
    plugins: createVitePlugins(viteEnv, isBuild),

    optimizeDeps: {
      // @iconify/iconify: The dependency is dynamically and virtually loaded by @purge-icons/generated, so it needs to be specified explicitly
      include: [
        '@iconify/iconify',
        'ant-design-vue/es/locale/zh_CN',
        'moment/dist/locale/zh-cn',
        'ant-design-vue/es/locale/en_US',
        'moment/dist/locale/eu',
      ],
      exclude: ['vue-demi', 'consolidate'],
    },
  };
};
