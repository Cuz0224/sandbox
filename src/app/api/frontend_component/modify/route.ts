import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const scene = formData.get('scene') as string;
    const componentName = formData.get('component_name') as string;
    const stypeTag = formData.get('stype_tag') as string;
    const functionTag = formData.get('function_tag') as string;
    const stylize = formData.get('stylize') as string;
    const file = formData.get('file') as File;

    // 验证必需参数
    if (!scene || !componentName || !file) {
      return NextResponse.json(
        { error: "缺少必需参数: scene, component_name, file" },
        { status: 400 }
      );
    }

    // 验证文件类型
    const allowedTypes = [
      'application/zip',
      'text/typescript',
      'text/javascript',
      'application/javascript',
      'text/plain'
    ];
    
    const isAllowedType = allowedTypes.includes(file.type) || 
                         file.name.endsWith('.tsx') || 
                         file.name.endsWith('.ts') || 
                         file.name.endsWith('.jsx') || 
                         file.name.endsWith('.js') || 
                         file.name.endsWith('.zip');

    if (!isAllowedType) {
      return NextResponse.json(
        { error: "不支持的文件类型。请上传 .tsx, .ts, .jsx, .js 或 .zip 文件" },
        { status: 400 }
      );
    }

    // 创建上传目录
    const uploadDir = join(process.cwd(), 'temp', 'template_uploads', scene);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 生成文件名（带时间戳避免冲突）
    const timestamp = Date.now();
    const fileName = `${componentName}_${timestamp}_${file.name}`;
    const filePath = join(uploadDir, fileName);

    // 保存文件
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // 处理 stylize 参数
    if (stylize && stylize.trim()) {
      const styleList = stylize.split(',').map(s => s.trim()).filter(s => s);
      console.log('应用风格到模板修改:', styleList);
      
      // 这里可以将风格信息保存到元数据文件中，或者用于后续处理
      const metadata = {
        scene,
        componentName,
        stypeTag,
        functionTag,
        stylize: styleList,
        uploadedAt: new Date().toISOString(),
        fileName: file.name
      };
      
      const metadataPath = join(uploadDir, `${componentName}_metadata.json`);
      await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    }

    // 记录模板修改信息（在实际项目中，您可能想要保存到数据库）
    const templateInfo = {
      id: `${scene}_${componentName}_${timestamp}`,
      scene,
      componentName,
      stypeTag,
      functionTag,
      fileName,
      filePath,
      uploadTime: new Date().toISOString(),
      fileSize: buffer.length,
      fileType: file.type
    };

    // 这里可以将模板信息保存到数据库
    // 当前只是模拟保存成功
    console.log('模板信息已保存:', templateInfo);

    return NextResponse.json({
      success: true,
      message: "模板修改上传成功",
      data: {
        templateId: templateInfo.id,
        scene: templateInfo.scene,
        componentName: templateInfo.componentName,
        uploadTime: templateInfo.uploadTime
      }
    });

  } catch (error) {
    console.error('修改模板错误:', error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
