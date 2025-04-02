import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { Scan, Vulnerability } from '@/types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface ScanReportPdfProps {
  scan: Scan;
  vulnerabilities: Vulnerability[];
}

export function ScanReportPdf({ scan, vulnerabilities }: ScanReportPdfProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  // Calculate security score based on scan.result
  const calculateSecurityScore = () => {
    if (!scan?.result) return 0;
    
    if (scan.result.securityScore !== undefined && scan.result.securityScore !== null) {
      return Math.round(scan.result.securityScore);
    }
    
    const highWeight = 5;
    const mediumWeight = 3;
    const lowWeight = 1;
    
    const highSeverity = scan.result.highSeverity || 0;
    const mediumSeverity = scan.result.mediumSeverity || 0;
    const lowSeverity = scan.result.lowSeverity || 0;
    
    const totalVulnWeight = 
      highSeverity * highWeight + 
      mediumSeverity * mediumWeight + 
      lowSeverity * lowWeight;
    
    if (totalVulnWeight === 0) return 100;
    
    const maxPenalty = 100;
    const score = Math.max(0, 100 - Math.min(maxPenalty, totalVulnWeight));
    
    return Math.round(score);
  };

  const securityScore = calculateSecurityScore();

  // Format date
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("ja-JP");
  };

  // Get severity text
  const getSeverityText = (severity: string) => {
    switch (severity) {
      case "high":
        return "高";
      case "medium":
        return "中";
      case "low":
        return "低";
      default:
        return severity;
    }
  };

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "待機中";
      case "running":
        return "実行中";
      case "completed":
        return "完了";
      case "failed":
        return "失敗";
      default:
        return status;
    }
  };

  // Generate PDF
  const generatePDF = async () => {
    if (!reportRef.current) return;

    try {
      const reportElement = reportRef.current;
      const canvas = await html2canvas(reportElement, {
        scale: 1.5, // 高い解像度を設定
        useCORS: true, // クロスオリジン画像を許可
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      // A4サイズの文書を作成（横向き）
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4のwidth
      const pageHeight = 297; // A4のheight
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // 複数ページの対応
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `セキュリティスキャンレポート_${scan.url.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('PDFの生成中にエラーが発生しました:', error);
      alert('PDFの生成中にエラーが発生しました。コンソールを確認してください。');
    }
  };

  // Severity color classes
  const getSeverityColorClass = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-orange-600";
      case "low":
        return "text-yellow-600";
      default:
        return "";
    }
  };

  return (
    <>
      <Button onClick={generatePDF} className="mb-4">
        <FileText className="h-4 w-4 mr-2" />
        PDFレポートをダウンロード
      </Button>

      {/* PDF Report Content - Hidden on screen but used for PDF generation */}
      <div className="hidden">
        <div ref={reportRef} className="p-8 bg-white" style={{ width: '800px' }}>
          {/* Report Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">セキュリティスキャンレポート</h1>
            <p className="text-gray-600">{new Date().toLocaleDateString('ja-JP')}</p>
          </div>

          {/* Scan Info */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 border-b pb-2">スキャン情報</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p><strong>スキャンURL:</strong> {scan.url}</p>
                <p><strong>スキャンID:</strong> {scan.id}</p>
                <p><strong>スキャンレベル:</strong> {
                  scan.scanLevel === "quick" ? "クイック" :
                  scan.scanLevel === "standard" ? "標準" :
                  scan.scanLevel === "detailed" ? "詳細" : scan.scanLevel
                }</p>
                <p><strong>クロール制限:</strong> {scan.crawlLimit || "N/A"}</p>
              </div>
              <div>
                <p><strong>ステータス:</strong> {getStatusText(scan.status)}</p>
                <p><strong>開始時間:</strong> {formatDate(scan.startedAt)}</p>
                <p><strong>完了時間:</strong> {formatDate(scan.completedAt)}</p>
                <p><strong>所要時間:</strong> {
                  scan.startedAt && scan.completedAt ? 
                  `${Math.round((new Date(scan.completedAt).getTime() - new Date(scan.startedAt).getTime()) / 1000)} 秒` : 
                  "N/A"
                }</p>
              </div>
            </div>
          </div>

          {/* Security Score */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 border-b pb-2">セキュリティスコア</h2>
            <div className="flex items-center justify-center mb-4">
              <div className={`text-6xl font-bold text-center ${
                securityScore >= 80 ? "text-green-600" :
                securityScore >= 60 ? "text-yellow-600" :
                "text-red-600"
              }`}>
                {securityScore}
              </div>
            </div>
            <div className="text-center mb-4">
              <p className="text-gray-600">
                {securityScore >= 80 ? "良好: 重大な脆弱性は検出されませんでした。" :
                 securityScore >= 60 ? "中程度: いくつかの脆弱性が検出されました。対応をご検討ください。" :
                 "危険: 重大な脆弱性が検出されました。早急な対応が必要です。"}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-xl font-bold text-red-600">{scan.result?.highSeverity || 0}</p>
                <p className="text-gray-600">高リスク</p>
              </div>
              <div>
                <p className="text-xl font-bold text-orange-600">{scan.result?.mediumSeverity || 0}</p>
                <p className="text-gray-600">中リスク</p>
              </div>
              <div>
                <p className="text-xl font-bold text-yellow-600">{scan.result?.lowSeverity || 0}</p>
                <p className="text-gray-600">低リスク</p>
              </div>
            </div>
          </div>

          {/* Vulnerabilities */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 border-b pb-2">検出された脆弱性 ({vulnerabilities.length})</h2>
            {vulnerabilities.length > 0 ? (
              vulnerabilities.map((vuln, index) => (
                <div key={vuln.id} className="mb-6 pb-4 border-b last:border-0">
                  <h3 className="text-xl font-bold">{index + 1}. {vuln.name}</h3>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <p><strong>URL:</strong> {vuln.url}</p>
                    <p><strong>重要度:</strong> <span className={getSeverityColorClass(vuln.severity)}>{getSeverityText(vuln.severity)}</span></p>
                    <p><strong>カテゴリ:</strong> {vuln.category}</p>
                    <p><strong>ステータス:</strong> {vuln.status}</p>
                  </div>
                  <p className="mt-2"><strong>説明:</strong> {vuln.description}</p>
                  {vuln.details && (
                    <div className="mt-2">
                      <p><strong>詳細:</strong></p>
                      <pre className="bg-gray-100 p-2 mt-1 text-sm rounded overflow-auto">{JSON.stringify(vuln.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-gray-600">脆弱性は検出されませんでした。</p>
            )}
          </div>

          {/* Recommendations */}
          {vulnerabilities.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 border-b pb-2">推奨される対策</h2>
              <ul className="list-disc pl-5">
                {vulnerabilities.filter(v => v.severity === "high").length > 0 && (
                  <li className="mb-2">高リスクの脆弱性に優先的に対応してください。特に、{
                    vulnerabilities.filter(v => v.severity === "high").map(v => v.category).filter((v, i, a) => a.indexOf(v) === i).join('、')
                  }に関連する問題が検出されています。</li>
                )}
                {vulnerabilities.some(v => v.category === "Header Configuration") && (
                  <li className="mb-2">セキュリティヘッダーの設定を見直し、強化してください。</li>
                )}
                {vulnerabilities.some(v => v.category === "Cross-Site Scripting") && (
                  <li className="mb-2">すべての入力フィールドとURLパラメータにエスケープ処理を実装してください。</li>
                )}
                {vulnerabilities.some(v => v.category === "Cookie Security") && (
                  <li className="mb-2">セキュアなクッキー設定（Secure、HttpOnly、SameSite属性）を導入してください。</li>
                )}
                {vulnerabilities.some(v => v.category === "Information Disclosure") && (
                  <li className="mb-2">サーバー情報や技術スタックの公開を制限してください。</li>
                )}
                {vulnerabilities.some(v => v.category === "Outdated Technology") && (
                  <li className="mb-2">古いHTTPプロトコルやTLS/SSLバージョンをアップデートしてください。</li>
                )}
                <li className="mb-2">定期的なセキュリティスキャンを実施し、新たな脆弱性を早期発見してください。</li>
              </ul>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-gray-600 mt-12 pt-4 border-t">
            <p>このレポートはAppSafeguardにより自動生成されました。</p>
            <p>© {new Date().getFullYear()} AppSafeguard</p>
          </div>
        </div>
      </div>
    </>
  );
}