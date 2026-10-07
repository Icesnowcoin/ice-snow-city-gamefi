import React from 'react';
import { CheckCircle, Clock, AlertCircle, QrCode } from 'lucide-react';
import { TransactionDetail } from '@/components/TransactionDetailModal';

interface TransactionPosterTemplateProps {
  transaction: TransactionDetail;
  lang: 'zh' | 'en';
  id?: string;
}

export const TransactionPosterTemplate: React.FC<TransactionPosterTemplateProps> = ({
  transaction,
  lang,
}) => {
  const getStatusIcon = () => {
    switch (transaction.status) {
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'pending':
        return <Clock className="w-16 h-16 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="w-16 h-16 text-red-500" />;
    }
  };

  const getStatusLabel = () => {
    switch (transaction.status) {
      case 'success':
        return lang === 'zh' ? '交易成功' : 'Transaction Successful';
      case 'pending':
        return lang === 'zh' ? '待处理中' : 'Pending';
      case 'failed':
        return lang === 'zh' ? '交易失败' : 'Transaction Failed';
    }
  };

  const getStatusColor = () => {
    switch (transaction.status) {
      case 'success':
        return 'from-green-500/20 to-green-600/10';
      case 'pending':
        return 'from-yellow-500/20 to-yellow-600/10';
      case 'failed':
        return 'from-red-500/20 to-red-600/10';
    }
  };

  const getTypeLabel = () => {
    const typeMap: Record<string, { zh: string; en: string }> = {
      deposit: { zh: '充值', en: 'Deposit' },
      withdrawal: { zh: '提取', en: 'Withdrawal' },
      refund: { zh: '退款', en: 'Refund' },
      fee: { zh: '手续费', en: 'Fee' },
      income: { zh: '收入', en: 'Income' },
      expense: { zh: '支出', en: 'Expense' },
    };
    return typeMap[transaction.type]?.[lang] || transaction.type;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div
      id="transaction-poster"
      className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-10 flex flex-col justify-between text-white"
      style={{
        backgroundImage:
          'radial-gradient(circle at 20% 50%, rgba(6, 182, 212, 0.1) 0%, transparent 50%), ' +
          'radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
      }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
          Ice Snow City
        </h1>
        <p className="text-gray-400 text-sm">
          {lang === 'zh' ? '交易凭证' : 'Transaction Receipt'}
        </p>
      </div>

      {/* Status Section */}
      <div className={`bg-gradient-to-r ${getStatusColor()} border border-gray-600/30 rounded-2xl p-8 text-center mb-8`}>
        <div className="flex justify-center mb-4">{getStatusIcon()}</div>
        <h2 className="text-3xl font-bold mb-2">{getStatusLabel()}</h2>
        <p className="text-gray-300">{transaction.description}</p>
      </div>

      {/* Amount Section */}
      <div className="bg-slate-800/50 border border-cyan-500/30 rounded-2xl p-8 mb-8">
        <p className="text-gray-400 text-center mb-2">
          {lang === 'zh' ? '交易金额' : 'Amount'}
        </p>
        <p className="text-5xl font-bold text-center text-cyan-400 mb-2">
          {parseFloat(transaction.amount).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 8,
          })}
        </p>
        <p className="text-center text-gray-400">ISC</p>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* Type */}
        <div className="bg-slate-800/30 border border-gray-600/20 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-1">
            {lang === 'zh' ? '交易类型' : 'Type'}
          </p>
          <p className="text-lg font-semibold text-white">{getTypeLabel()}</p>
        </div>

        {/* Status */}
        <div className="bg-slate-800/30 border border-gray-600/20 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-1">
            {lang === 'zh' ? '状态' : 'Status'}
          </p>
          <p className="text-lg font-semibold text-white capitalize">
            {transaction.status}
          </p>
        </div>

        {/* Date */}
        <div className="bg-slate-800/30 border border-gray-600/20 rounded-lg p-4 col-span-2">
          <p className="text-xs text-gray-400 mb-1">
            {lang === 'zh' ? '时间' : 'Date'}
          </p>
          <p className="text-sm font-mono text-white">{formatDate(transaction.createdAt)}</p>
        </div>

        {/* Transaction ID */}
        {transaction.txHash && (
          <div className="bg-slate-800/30 border border-gray-600/20 rounded-lg p-4 col-span-2">
            <p className="text-xs text-gray-400 mb-1">
              {lang === 'zh' ? '交易哈希' : 'Transaction Hash'}
            </p>
            <p className="text-xs font-mono text-cyan-400 break-all">
              {transaction.txHash}
            </p>
          </div>
        )}

        {/* Balance */}
        {transaction.balance && (
          <div className="bg-slate-800/30 border border-gray-600/20 rounded-lg p-4 col-span-2">
            <p className="text-xs text-gray-400 mb-1">
              {lang === 'zh' ? '余额' : 'Balance'}
            </p>
            <p className="text-lg font-semibold text-white">
              {parseFloat(transaction.balance).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 8,
              })}{' '}
              ISC
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-600/30 pt-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <QrCode className="w-5 h-5 text-cyan-400" />
          <p className="text-sm text-gray-400">
            {lang === 'zh' ? '扫描二维码查看详情' : 'Scan QR code for details'}
          </p>
        </div>
        <p className="text-xs text-gray-500">
          {lang === 'zh'
            ? '此凭证由 Ice Snow City 生成，仅供参考'
            : 'This receipt is generated by Ice Snow City for reference only'}
        </p>
      </div>
    </div>
  );
};
