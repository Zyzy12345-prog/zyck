const fs = require('fs');
const path = require('path');

// 创建必要的目录
const directories = [
  'uploads',
  'uploads/recordings'
];

directories.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`创建目录: ${dir}`);
  }
});

console.log('初始化完成！');
