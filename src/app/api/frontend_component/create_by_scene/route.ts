import { NextRequest, NextResponse } from 'next/server';

// 模拟场景模板数据
const SCENE_TEMPLATES: Record<string, any[]> = {
  '电商平台': [
    ["ProductCard", "card,button,badge,image", "商品卡片组件，展示商品信息、价格、评分等", "商品列表, 商品搜索结果", "电商平台", "现代简约", "商品展示"],
    ["ShoppingCart", "dialog,button,list,badge", "购物车组件，支持商品增减、删除、价格计算", "商品详情页, 购物车页", "电商平台", "交互友好", "购物功能"],
    ["UserProfile", "form,avatar,tabs,button", "用户资料组件，支持信息编辑和头像上传", "用户中心, 个人设置", "电商平台", "简洁实用", "用户管理"]
  ],
  '后台管理系统': [
    ["DataTable", "table,pagination,filter,sort", "数据表格组件，支持排序、筛选、分页功能", "数据管理页, 列表页", "后台管理", "专业严谨", "数据展示"],
    ["AdminSidebar", "navigation,menu,collapse", "管理后台侧边栏，支持多级菜单和折叠", "所有管理页面", "后台管理", "功能导向", "导航组件"],
    ["StatisticsCard", "card,chart,icon,number", "统计卡片组件，展示关键指标和趋势", "仪表板, 统计页面", "后台管理", "数据可视化", "统计展示"]
  ],
  '数据分析平台': [
    ["ChartPanel", "chart,filter,export,legend", "图表面板组件，支持多种图表类型和交互", "数据分析页, 报表页", "数据分析", "专业图表", "数据可视化"],
    ["FilterPanel", "select,date-picker,checkbox,button", "筛选面板组件，支持多维度数据筛选", "分析页面, 报表页面", "数据分析", "功能完整", "数据筛选"],
    ["ReportGenerator", "form,template,export,preview", "报表生成器，支持自定义报表模板和导出", "报表中心, 数据导出", "数据分析", "自动化工具", "报表生成"]
  ]
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const scene = formData.get('scene') as string;
    const scene_en = formData.get('scene_en') as string;
    const stylize = formData.get('stylize') as string;

    if (!scene) {
      return NextResponse.json(
        { status: "1", error: "场景参数不能为空" },
        { status: 400 }
      );
    }

    // 查找匹配的场景模板
    let templateData = SCENE_TEMPLATES[scene];
    
    // 如果没有完全匹配，尝试模糊匹配
    if (!templateData) {
      const matchedKey = Object.keys(SCENE_TEMPLATES).find(key => 
        key.includes(scene) || scene.includes(key)
      );
      
      if (matchedKey) {
        templateData = SCENE_TEMPLATES[matchedKey];
      }
    }

    // 如果仍然没有匹配，生成默认模板
    if (!templateData) {
      templateData = [
        ["CustomComponent", "card,button,input", `${scene}自定义组件，根据场景需求定制`, "通用页面", scene, "通用风格", "基础功能"],
        ["LayoutWrapper", "layout,container,grid", `${scene}布局容器，提供响应式布局支持`, "所有页面", scene, "响应式", "布局组件"],
        ["ActionPanel", "button,form,modal", `${scene}操作面板，集成常用操作功能`, "操作页面", scene, "交互式", "操作工具"]
      ];
    }

    // 处理 stylize 参数 - 如果有风格参数，在模板数据中添加风格信息
    if (stylize && stylize.trim()) {
      const styleList = stylize.split(',').map(s => s.trim()).filter(s => s);
      console.log('应用风格:', styleList);
      
      // 在模板数据中添加风格信息（可以用于后续处理）
      templateData = templateData.map(template => {
        // 在模板描述中添加风格信息
        const originalDesc = template[2];
        const styleInfo = styleList.length > 0 ? ` [风格: ${styleList.join(', ')}]` : '';
        template[2] = originalDesc + styleInfo;
        return template;
      });
    }

    const response = {
      status: "0",
      data: {
        keys: ["component_name", "applied_components", "component_desc", "applicable_pages", "scene_tag", "stype_tag", "function_tag"],
        data: templateData
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('创建场景模板错误:', error);
    return NextResponse.json(
      { status: "1", error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
