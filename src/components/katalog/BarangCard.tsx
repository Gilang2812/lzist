
import type { Barang } from '../../types';

interface BarangCardProps {
  barang: Barang;
  onClick?: () => void;
}

const BarangCard = ({ barang, onClick }: BarangCardProps) => {
  const subBarang = barang.subBarang ?? [];
  const totalStock = subBarang.reduce((sum, sb) => sum + sb.stock, 0);

  return (
    <div
      onClick={onClick}
      className="bg-surface-container-lowest rounded-xl border border-surface-variant p-md cursor-pointer hover:shadow-md hover:border-primary-fixed-dim transition-all"
    >
      <h3 className="font-h3 text-h3 text-on-surface mb-xs">{barang.name}</h3>

      <p className="font-body-sm text-body-sm text-on-surface-variant">
        {subBarang.length} varian · Total stok: {totalStock}
      </p>
    </div>
  );
};

export default BarangCard;
