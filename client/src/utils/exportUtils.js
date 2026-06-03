/**
 * 数据导出工具
 * 支持 CSV 和 Excel 格式导出
 */

import { message } from 'antd';
import * as XLSX from 'xlsx';

/**
 * 导出为 CSV 格式
 * @param {Array} data - 数据数组
 * @param {Array} columns - 列配置 [{key: 'name', label: '姓名'}, ...]
 * @param {string} filename - 文件名
 */
export const exportToCSV = (data, columns, filename = 'export') => {
  try {
    if (!data || data.length === 0) {
      message.warning('暂无数据可导出');
      return;
    }

    // 添加 UTF-8 BOM
    let csvContent = '\uFEFF';
    
    // 添加表头
    csvContent += columns.map(col => col.label).join(',') + '\n';
    
    // 添加数据行
    data.forEach(row => {
      const values = columns.map(col => {
        let value = row[col.key];
        
        // 处理特殊值
        if (value === null || value === undefined) {
          return '';
        }
        
        // 如果有格式化函数，使用它
        if (col.formatter) {
          value = col.formatter(value, row);
        }
        
        // 转换为字符串并处理逗号和引号
        value = String(value);
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = '"' + value.replace(/"/g, '""') + '"';
        }
        
        return value;
      });
      
      csvContent += values.join(',') + '\n';
    });

    // 创建下载
    downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
    message.success('CSV 导出成功');
  } catch (error) {
    console.error('CSV 导出失败:', error);
    message.error('导出失败');
  }
};

/**
 * 导出为 Excel 格式
 * @param {Array} data - 数据数组
 * @param {Array} columns - 列配置
 * @param {string} filename - 文件名
 * @param {string} sheetName - 工作表名称
 */
export const exportToExcel = (data, columns, filename = 'export', sheetName = 'Sheet1') => {
  try {
    if (!data || data.length === 0) {
      message.warning('暂无数据可导出');
      return;
    }

    // 准备数据
    const exportData = data.map(row => {
      const obj = {};
      columns.forEach(col => {
        let value = row[col.key];
        
        // 如果有格式化函数，使用它
        if (col.formatter) {
          value = col.formatter(value, row);
        }
        
        obj[col.label] = value;
      });
      return obj;
    });

    // 创建工作簿
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // 设置列宽
    const colWidths = columns.map(col => ({
      wch: col.width || 15
    }));
    worksheet['!cols'] = colWidths;

    // 导出文件
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    message.success('Excel 导出成功');
  } catch (error) {
    console.error('Excel 导出失败:', error);
    message.error('导出失败');
  }
};

/**
 * 导出多个工作表的 Excel
 * @param {Array} sheets - 工作表数组 [{name: 'Sheet1', data: [], columns: []}, ...]
 * @param {string} filename - 文件名
 */
export const exportMultiSheetExcel = (sheets, filename = 'export') => {
  try {
    if (!sheets || sheets.length === 0) {
      message.warning('暂无数据可导出');
      return;
    }

    const workbook = XLSX.utils.book_new();

    sheets.forEach(sheet => {
      if (!sheet.data || sheet.data.length === 0) return;

      // 准备数据
      const exportData = sheet.data.map(row => {
        const obj = {};
        sheet.columns.forEach(col => {
          let value = row[col.key];
          if (col.formatter) {
            value = col.formatter(value, row);
          }
          obj[col.label] = value;
        });
        return obj;
      });

      // 创建工作表
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // 设置列宽
      if (sheet.columns) {
        const colWidths = sheet.columns.map(col => ({
          wch: col.width || 15
        }));
        worksheet['!cols'] = colWidths;
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name || 'Sheet');
    });

    // 导出文件
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    message.success('Excel 导出成功');
  } catch (error) {
    console.error('Excel 导出失败:', error);
    message.error('导出失败');
  }
};

/**
 * 下载文件
 * @param {string} content - 文件内容
 * @param {string} filename - 文件名
 * @param {string} mimeType - MIME 类型
 */
const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

/**
 * 导出表格数据（自动检测格式）
 * @param {Array} data - 数据数组
 * @param {Array} columns - 列配置
 * @param {string} filename - 文件名
 * @param {string} format - 格式 ('csv' | 'excel')
 */
export const exportTableData = (data, columns, filename = 'export', format = 'excel') => {
  if (format === 'csv') {
    exportToCSV(data, columns, filename);
  } else {
    exportToExcel(data, columns, filename);
  }
};

export default {
  exportToCSV,
  exportToExcel,
  exportMultiSheetExcel,
  exportTableData
};











