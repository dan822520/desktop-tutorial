import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';

interface ScanViewProps {
  onResult: (value: string) => void;
  onCancel?: () => void;
}

const ScanView: React.FC<ScanViewProps> = ({ onResult, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [cameraReady, setCameraReady] = useState(false);

  const stopReader = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
  }, []);

  useEffect(() => {
    const setup = async () => {
      if (!videoRef.current) return;
      const reader = new BrowserQRCodeReader(undefined, {
        delayBetweenScanAttempts: 300,
        delayBetweenScanSuccess: 800
      });
      try {
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result, err, controls) => {
            if (controls) {
              controlsRef.current = controls;
            }
            if (result) {
              stopReader();
              onResult(result.getText());
            } else if (err && err.name !== 'NotFoundException') {
              setError(err.message);
            }
          }
        );
        controlsRef.current = controls;
        setCameraReady(true);
      } catch (err) {
        setError((err as Error).message || '无法启动摄像头');
      }
    };

    setup();

    return () => {
      stopReader();
    };
  }, [onResult, stopReader]);

  const handleManualSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!manualInput.trim()) {
      setError('请输入资产编码');
      return;
    }
    stopReader();
    onResult(manualInput.trim());
  };

  return (
    <div className="scan-view">
      <div className="status-banner">{cameraReady ? '请对准资产二维码进行扫描' : '正在启动摄像头…'}</div>
      <video ref={videoRef} playsInline muted autoPlay />
      {error ? <div className="error-text">{error}</div> : null}
      <form className="manual-input" onSubmit={handleManualSubmit}>
        <input
          type="text"
          value={manualInput}
          onChange={event => setManualInput(event.target.value)}
          placeholder="无法扫码？请输入资产编号"
        />
        <button type="submit" className="secondary-button">
          手动查询
        </button>
      </form>
      {onCancel ? (
        <button type="button" className="secondary-button" onClick={onCancel}>
          返回首页
        </button>
      ) : null}
    </div>
  );
};

export default ScanView;
