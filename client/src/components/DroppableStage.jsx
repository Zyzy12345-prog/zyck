import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, Badge, Empty } from 'antd';
import OpportunityCard from './OpportunityCard';
import './DroppableStage.css';

const DroppableStage = ({ stage, opportunities, onRefresh }) => {
  // 使用 'stage-' 前缀确保阶段ID唯一
  const droppableId = `stage-${stage.id}`;
  
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: {
      type: 'stage',
      stageId: stage.id,
      stageName: stage.name
    }
  });

  const totalAmount = opportunities.reduce((sum, opp) => sum + parseFloat(opp.expectedAmount || 0), 0);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // 只有当拖拽卡片的中心点进入该区域时才高亮
  return (
    <div 
      ref={setNodeRef}
      className={`droppable-stage ${isOver ? 'stage-active' : ''}`}
    >
      <Card
        className={`stage-card ${isOver ? 'drag-over' : ''}`}
        title={
          <div className="stage-header">
            <Badge
              count={opportunities.length}
              style={{ backgroundColor: stage.color }}
            >
              <span className="stage-name">{stage.name}</span>
            </Badge>
            <span className="stage-amount">{formatCurrency(totalAmount)}</span>
          </div>
        }
        variant="borderless"
      >
        <div
          className={`opportunities-list ${isOver ? 'drag-over-list' : ''}`}
          style={{ 
            minHeight: '500px',
            position: 'relative',
            padding: '12px'
          }}
        >
          <SortableContext
            items={opportunities.map(opp => opp.id)}
            strategy={verticalListSortingStrategy}
          >
            {opportunities.length > 0 ? (
              opportunities.map((opportunity) => (
                <OpportunityCard
                  key={opportunity.id}
                  opportunity={opportunity}
                  onRefresh={onRefresh}
                />
              ))
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无商机"
                style={{ marginTop: 60 }}
              />
            )}
          </SortableContext>
        </div>
      </Card>
    </div>
  );
};

export default DroppableStage;

