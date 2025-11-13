import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

export class QRCodeService {
  private static baseUrl = process.env.QR_CODE_BASE_URL || 'http://localhost:3000';
  private static qrCodeDir = process.env.QR_CODE_DIR || './uploads/qrcodes';

  // 确保二维码目录存在
  static ensureDirectory() {
    if (!fs.existsSync(this.qrCodeDir)) {
      fs.mkdirSync(this.qrCodeDir, { recursive: true });
    }
  }

  // 生成资产二维码内容
  static generateAssetQRContent(assetId: string): string {
    return `${this.baseUrl}/api/assets/scan/${assetId}`;
  }

  // 生成二维码图片
  static async generateQRCodeImage(content: string, filename: string): Promise<string> {
    this.ensureDirectory();

    const filepath = path.join(this.qrCodeDir, `${filename}.png`);

    try {
      await QRCode.toFile(filepath, content, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return `/uploads/qrcodes/${filename}.png`;
    } catch (error) {
      console.error('生成二维码失败:', error);
      throw new Error('生成二维码失败');
    }
  }

  // 生成Base64格式的二维码
  static async generateQRCodeBase64(content: string): Promise<string> {
    try {
      const base64 = await QRCode.toDataURL(content, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return base64;
    } catch (error) {
      console.error('生成二维码失败:', error);
      throw new Error('生成二维码失败');
    }
  }

  // 批量生成二维码
  static async generateBatch(assets: Array<{ id: string; asset_id: string }>): Promise<Array<{ id: string; qr_code_content: string; qr_code_image_url: string }>> {
    const results = [];

    for (const asset of assets) {
      const content = this.generateAssetQRContent(asset.asset_id);
      const imageUrl = await this.generateQRCodeImage(content, asset.asset_id);

      results.push({
        id: asset.id,
        qr_code_content: content,
        qr_code_image_url: imageUrl
      });
    }

    return results;
  }
}
