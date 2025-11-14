import React from 'react';

interface Asset {
  id: number;
  asset_id: string;
  name: string;
  status: string;
  location?: string | null;
  org?: { name: string } | null;
  department?: { name: string } | null;
  user?: { real_name: string | null } | null;
  category?: { name: string } | null;
  purchase_date?: string | null;
  purchase_price?: number | null;
}

interface AssetCardProps {
  asset: Asset;
}

const AssetCard: React.FC<AssetCardProps> = ({ asset }) => {
  return (
    <div className="asset-card">
      <header>
        <div>
          <h3>{asset.name}</h3>
          <span>资产编号：{asset.asset_id}</span>
        </div>
        <span>{statusLabel[asset.status] || asset.status}</span>
      </header>

      <div className="asset-meta">
        <div>
          <small>所属组织</small>
          <span>{asset.org?.name || '—'}</span>
        </div>
        <div>
          <small>使用部门</small>
          <span>{asset.department?.name || '—'}</span>
        </div>
        <div>
          <small>负责人</small>
          <span>{asset.user?.real_name || '—'}</span>
        </div>
        <div>
          <small>存放位置</small>
          <span>{asset.location || '—'}</span>
        </div>
      </div>

      <div className="asset-meta">
        <div>
          <small>分类</small>
          <span>{asset.category?.name || '—'}</span>
        </div>
        <div>
          <small>采购日期</small>
          <span>{asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : '—'}</span>
        </div>
        <div>
          <small>采购金额</small>
          <span>{asset.purchase_price ? `¥${asset.purchase_price}` : '—'}</span>
        </div>
      </div>
    </div>
  );
};

const statusLabel: Record<string, string> = {
  ACTIVE: '在用',
  IDLE: '闲置',
  TRANSFERRING: '调拨中',
  REPAIRING: '维修中',
  SCRAPPED: '已报废'
};

export default AssetCard;
