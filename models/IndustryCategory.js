module.exports = (sequelize, DataTypes) => {
  const IndustryCategory = sequelize.define('IndustryCategory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'parent_id',
      comment: '父级ID，0表示一级分类'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '行业名称',
      validate: {
        notEmpty: true
      }
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '行业代码'
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: '层级：1=一级分类，2=二级分类，3=三级分类',
      validate: {
        min: 1,
        max: 3
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
      comment: '是否启用'
    },
    keywords: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '关键词，用于智能匹配',
      get() {
        const rawValue = this.getDataValue('keywords');
        return rawValue || [];
      }
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'sort_order',
      comment: '排序顺序'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    tableName: 'industry_categories',
    timestamps: true,
    underscored: true
  });

  IndustryCategory.associate = function(models) {
    // 自关联：父级分类
    IndustryCategory.belongsTo(models.IndustryCategory, {
      foreignKey: 'parentId',
      as: 'parent',
      constraints: false
    });

    // 自关联：子级分类
    IndustryCategory.hasMany(models.IndustryCategory, {
      foreignKey: 'parentId',
      as: 'children',
      constraints: false
    });

    // 关联客户表
    IndustryCategory.hasMany(models.Client, {
      foreignKey: 'industryId',
      as: 'clients'
    });
  };

  // 实例方法：获取完整路径
  IndustryCategory.prototype.getFullPath = async function() {
    const path = [this.name];
    let current = this;
    
    while (current.parentId !== 0) {
      const parent = await IndustryCategory.findByPk(current.parentId);
      if (!parent) break;
      path.unshift(parent.name);
      current = parent;
    }
    
    return path.join(' > ');
  };

  // 类方法：根据关键词智能匹配行业
  IndustryCategory.matchByKeywords = async function(text) {
    if (!text) return null;
    
    const categories = await IndustryCategory.findAll({
      where: { isActive: true },
      order: [['level', 'DESC']] // 优先匹配更具体的分类
    });

    for (const category of categories) {
      const keywords = category.keywords || [];
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return category;
        }
      }
    }
    
    return null;
  };

  // 类方法：获取树形结构
  IndustryCategory.getTree = async function(parentId = 0) {
    const categories = await IndustryCategory.findAll({
      where: { 
        parentId,
        isActive: true 
      },
      order: [['sortOrder', 'ASC'], ['id', 'ASC']]
    });

    const tree = [];
    for (const category of categories) {
      const node = category.toJSON();
      node.children = await IndustryCategory.getTree(category.id);
      tree.push(node);
    }

    return tree;
  };

  return IndustryCategory;
};





