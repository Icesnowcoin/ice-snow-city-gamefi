/**
 * Ice Snow City - WebGL / WebGPU Compatibility Detection Utility
 * 用于检测客户端设备是否支持 3D 渲染所需的高性能图形上下文，
 * 在不支持或禁用硬件加速的设备上提供友好的降级提示与备用方案。
 */

export interface GraphicsCapabilityResult {
  hasWebGL: boolean;
  hasWebGL2: boolean;
  hasWebGPU: boolean;
  isHardwareAccelerated: boolean;
  rendererInfo?: string;
  errorMessage?: string;
}

/**
 * 检测当前客户端的图形渲染能力
 */
export function checkGraphicsCapability(): GraphicsCapabilityResult {
  let hasWebGL = false;
  let hasWebGL2 = false;
  let hasWebGPU = typeof navigator !== 'undefined' && 'gpu' in navigator;
  let isHardwareAccelerated = false;
  let rendererInfo = 'Unknown';
  let errorMessage: string | undefined = undefined;

  if (typeof window === 'undefined') {
    return {
      hasWebGL: false,
      hasWebGL2: false,
      hasWebGPU: false,
      isHardwareAccelerated: false,
      errorMessage: 'SSR environment - WebGL not available'
    };
  }

  try {
    const canvas = document.createElement('canvas');
    
    // Check WebGL 2.0
    const gl2 = canvas.getContext('webgl2') || canvas.getContext('experimental-webgl2');
    if (gl2) {
      hasWebGL2 = true;
      hasWebGL = true;
    } else {
      // Check WebGL 1.0
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        hasWebGL = true;
      }
    }

    if (hasWebGL) {
      const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl')) as WebGLRenderingContext | null;
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
          rendererInfo = `${vendor} / ${renderer}`;
          
          // Heuristic for software rendering (e.g. SwiftShader, llvmpipe)
          const lowerRenderer = renderer.toLowerCase();
          if (
            lowerRenderer.includes('swiftshader') ||
            lowerRenderer.includes('llvmpipe') ||
            lowerRenderer.includes('software') ||
            lowerRenderer.includes('vmware')
          ) {
            isHardwareAccelerated = false;
            errorMessage = '检测到浏览器启用了软件渲染 (Software Rendering)，3D 场景可能运行缓慢。';
          } else {
            isHardwareAccelerated = true;
          }
        } else {
          isHardwareAccelerated = true;
          rendererInfo = 'Standard WebGL Renderer';
        }
      }
    } else {
      errorMessage = '您的浏览器或设备不支持 WebGL / 3D 图形加速。';
    }
  } catch (err: any) {
    errorMessage = `WebGL 初始化异常: ${err?.message || '未知错误'}`;
    isHardwareAccelerated = false;
  }

  return {
    hasWebGL,
    hasWebGL2,
    hasWebGPU,
    isHardwareAccelerated,
    rendererInfo,
    errorMessage
  };
}
