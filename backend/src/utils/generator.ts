/**
 * 编号生成器工具
 */

// 生成资产编号
// 格式: EQP-SH-A01-000123 (分类码-组织码-部门码-序号)
export function generateAssetId(
  categoryCode: string,
  orgCode: string,
  deptCode?: string,
  sequence?: number
): string {
  const parts = [categoryCode, orgCode];

  if (deptCode) {
    parts.push(deptCode);
  }

  const seqStr = sequence ? sequence.toString().padStart(6, '0') : generateSequence();
  parts.push(seqStr);

  return parts.join('-');
}

// 生成调拨单号
// 格式: TR-20240101-000001
export function generateTransferNo(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = generateSequence();
  return `TR-${dateStr}-${seq}`;
}

// 生成维修单号
// 格式: RP-20240101-000001
export function generateRepairNo(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = generateSequence();
  return `RP-${dateStr}-${seq}`;
}

// 生成盘点任务编号
// 格式: IV-20240101-000001
export function generateInventoryTaskNo(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = generateSequence();
  return `IV-${dateStr}-${seq}`;
}

// 生成6位序列号
function generateSequence(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  const seq = (timestamp + random) % 1000000;
  return seq.toString().padStart(6, '0');
}

// 解析资产编号
export function parseAssetId(assetId: string): {
  categoryCode: string;
  orgCode: string;
  deptCode?: string;
  sequence: string;
} | null {
  const parts = assetId.split('-');

  if (parts.length < 3) {
    return null;
  }

  if (parts.length === 3) {
    return {
      categoryCode: parts[0],
      orgCode: parts[1],
      sequence: parts[2]
    };
  }

  return {
    categoryCode: parts[0],
    orgCode: parts[1],
    deptCode: parts[2],
    sequence: parts[3]
  };
}
