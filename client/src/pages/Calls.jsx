import React from 'react';
import CallRecords from './CallRecords';

/**
 * 兼容路由：`/calls`
 * 目前系统里已有 `CallRecords`（路由也有 `/call-records`），这里先复用它，
 * 避免因为缺失页面导致 Vite 无法启动。
 */
export default function Calls() {
  return <CallRecords />;
}




