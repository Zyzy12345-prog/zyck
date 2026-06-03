// 测试路由是否正确加载
const app = require('./app');

console.log('\n=== 检查路由注册 ===\n');

let routeCount = 0;
const routes = [];

app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    // 直接注册的路由
    routes.push({
      path: middleware.route.path,
      methods: Object.keys(middleware.route.methods)
    });
    routeCount++;
  } else if (middleware.name === 'router') {
    // 通过 Router 注册的路由
    const routerPath = middleware.regexp.toString().replace('/^', '').replace('\\/?(?=\\/|$)/i', '').replace(/\\\//g, '/');
    
    middleware.handle.stack.forEach((handler) => {
      if (handler.route) {
        const fullPath = routerPath + handler.route.path;
        routes.push({
          path: fullPath,
          methods: Object.keys(handler.route.methods)
        });
        routeCount++;
      }
    });
  }
});

console.log(`总共找到 ${routeCount} 个路由\n`);

// 查找客户拓展相关路由
const expansionRoutes = routes.filter(r => 
  r.path.includes('lead') || r.path.includes('pool') || r.path.includes('tag')
);

console.log('客户拓展相关路由:');
if (expansionRoutes.length > 0) {
  expansionRoutes.forEach(r => {
    console.log(`  ${r.methods.join(', ').toUpperCase().padEnd(20)} ${r.path}`);
  });
} else {
  console.log('  ❌ 未找到客户拓展路由！');
}

console.log('\n所有API路由:');
routes.filter(r => r.path.startsWith('/api')).forEach(r => {
  console.log(`  ${r.methods.join(', ').toUpperCase().padEnd(20)} ${r.path}`);
});

process.exit(0);











