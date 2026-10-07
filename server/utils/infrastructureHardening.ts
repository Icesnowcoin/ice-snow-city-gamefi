/**
 * Infrastructure Hardening Module
 * 
 * Phase 78: 基础设施加固 - WAF 和 DDoS 防护
 * 
 * 功能：
 * 1. WAF (Web 应用防火墙) 配置
 * 2. DDoS 防护策略
 * 3. 网络分段配置
 * 4. IDS/IPS 规则
 * 5. 安全头配置
 * 6. 速率限制策略
 */

/**
 * WAF 规则
 */
export interface WAFRule {
  id: string;
  name: string;
  description: string;
  pattern: string;
  action: 'allow' | 'block' | 'challenge';
  priority: number;
  enabled: boolean;
}

/**
 * DDoS 防护配置
 */
export interface DDoSConfig {
  enabled: boolean;
  threshold: number; // 请求/秒
  blockDuration: number; // 秒
  whitelistIPs: string[];
  blacklistIPs: string[];
  geoBlocking: {
    enabled: boolean;
    blockedCountries: string[];
  };
}

/**
 * 安全头配置
 */
export interface SecurityHeaders {
  'Content-Security-Policy': string;
  'X-Content-Type-Options': string;
  'X-Frame-Options': string;
  'X-XSS-Protection': string;
  'Strict-Transport-Security': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
}

/**
 * 网络分段配置
 */
export interface NetworkSegmentation {
  publicZone: string[];
  applicationZone: string[];
  databaseZone: string[];
  managementZone: string[];
}

/**
 * IDS/IPS 规则
 */
export interface IDSIPSRule {
  id: string;
  name: string;
  signature: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  action: 'alert' | 'drop' | 'reject';
  enabled: boolean;
}

/**
 * 基础设施加固管理器
 */
export class InfrastructureHardeningManager {
  private wafRules: Map<string, WAFRule> = new Map();
  private ddosConfig: DDoSConfig;
  private securityHeaders: SecurityHeaders;
  private networkSegmentation: NetworkSegmentation;
  private idsipsRules: Map<string, IDSIPSRule> = new Map();
  private requestCounts: Map<string, number[]> = new Map();

  constructor() {
    this.ddosConfig = this.getDefaultDDoSConfig();
    this.securityHeaders = this.getDefaultSecurityHeaders();
    this.networkSegmentation = this.getDefaultNetworkSegmentation();
    this.initializeWAFRules();
    this.initializeIDSIPSRules();
  }

  /**
   * 获取默认 DDoS 配置
   */
  private getDefaultDDoSConfig(): DDoSConfig {
    return {
      enabled: true,
      threshold: 1000, // 1000 req/s
      blockDuration: 300, // 5 分钟
      whitelistIPs: [],
      blacklistIPs: [],
      geoBlocking: {
        enabled: false,
        blockedCountries: [],
      },
    };
  }

  /**
   * 获取默认安全头
   */
  private getDefaultSecurityHeaders(): SecurityHeaders {
    return {
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    };
  }

  /**
   * 获取默认网络分段
   */
  private getDefaultNetworkSegmentation(): NetworkSegmentation {
    return {
      publicZone: ['0.0.0.0/0'],
      applicationZone: ['10.0.1.0/24'],
      databaseZone: ['10.0.2.0/24'],
      managementZone: ['10.0.3.0/24'],
    };
  }

  /**
   * 初始化 WAF 规则
   */
  private initializeWAFRules(): void {
    const defaultRules: readonly WAFRule[] = [
      {
        id: 'waf_sql_injection',
        name: 'SQL Injection Protection',
        description: 'Blocks common SQL injection patterns',
        pattern: "('|(\\-\\-)|(;)|(\\|\\|)|(\\*))",
        action: 'block',
        priority: 1,
        enabled: true,
      },
      {
        id: 'waf_xss',
        name: 'XSS Protection',
        description: 'Blocks common XSS patterns',
        pattern: '(<script|javascript:|onerror=|onload=)',
        action: 'block',
        priority: 2,
        enabled: true,
      },
      {
        id: 'waf_path_traversal',
        name: 'Path Traversal Protection',
        description: 'Blocks path traversal attempts',
        pattern: '(\\.\\./|\\.\\\\)',
        action: 'block',
        priority: 3,
        enabled: true,
      },
      {
        id: 'waf_command_injection',
        name: 'Command Injection Protection',
        description: 'Blocks command injection attempts',
        pattern: '(;|\\||&|`|\\$\\()',
        action: 'block',
        priority: 4,
        enabled: true,
      },
      {
        id: 'waf_rate_limit',
        name: 'Rate Limiting',
        description: 'Enforces rate limits',
        pattern: '.*',
        action: 'challenge',
        priority: 5,
        enabled: true,
      },
    ];

    defaultRules.forEach((rule) => {
      this.wafRules.set(rule.id, rule);
    });
  }

  /**
   * 初始化 IDS/IPS 规则
   */
  private initializeIDSIPSRules(): void {
    const defaultRules: readonly IDSIPSRule[] = [
      {
        id: 'ids_port_scan',
        name: 'Port Scan Detection',
        signature: 'TCP|SYN|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*',
        severity: 'high',
        action: 'alert',
        enabled: true,
      },
      {
        id: 'ids_brute_force',
        name: 'Brute Force Attack Detection',
        signature: 'HTTP|POST|/api/auth/login|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*',
        severity: 'high',
        action: 'alert',
        enabled: true,
      },
      {
        id: 'ids_malware',
        name: 'Malware Detection',
        signature: '.*\\.exe|.*\\.bat|.*\\.cmd|.*\\.scr|.*\\.vbs',
        severity: 'critical',
        action: 'drop',
        enabled: true,
      },
      {
        id: 'ids_botnet',
        name: 'Botnet Communication Detection',
        signature: 'DNS|*|.*\\.onion|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*|*',
        severity: 'critical',
        action: 'drop',
        enabled: true,
      },
    ];

    defaultRules.forEach((rule) => {
      this.idsipsRules.set(rule.id, rule);
    });
  }

  /**
   * 检查 DDoS 攻击
   */
  checkDDoSAttack(clientIP: string): { isAttack: boolean; action: string } {
    if (!this.ddosConfig.enabled) {
      return { isAttack: false, action: 'allow' };
    }

    // 检查黑名单
    if (this.ddosConfig.blacklistIPs.includes(clientIP)) {
      return { isAttack: true, action: 'block' };
    }

    // 检查白名单
    if (this.ddosConfig.whitelistIPs.includes(clientIP)) {
      return { isAttack: false, action: 'allow' };
    }

    // 检查请求速率
    const now = Date.now();
    const timestamps = this.requestCounts.get(clientIP) || [];

    // 移除 1 秒前的请求
    const recentRequests = timestamps.filter((t) => now - t < 1000);

    if (recentRequests.length >= this.ddosConfig.threshold) {
      return { isAttack: true, action: 'block' };
    }

    recentRequests.push(now);
    this.requestCounts.set(clientIP, recentRequests);

    return { isAttack: false, action: 'allow' };
  }

  /**
   * 检查 WAF 规则
   */
  checkWAFRules(input: string): { blocked: boolean; rule?: WAFRule } {
    let result: { blocked: boolean; rule?: WAFRule } = { blocked: false };
    
    this.wafRules.forEach((rule) => {
      if (result.blocked) return; // Early exit if already blocked
      if (!rule.enabled) return;

      const regex = new RegExp(rule.pattern, 'i');
      if (regex.test(input)) {
        if (rule.action === 'block') {
          result = { blocked: true, rule };
        }
      }
    });

    return result;
  }

  /**
   * 添加 WAF 规则
   */
  addWAFRule(rule: WAFRule): void {
    this.wafRules.set(rule.id, rule);
  }

  /**
   * 删除 WAF 规则
   */
  removeWAFRule(ruleId: string): void {
    this.wafRules.delete(ruleId);
  }

  /**
   * 获取所有 WAF 规则
   */
  getWAFRules(): WAFRule[] {
    const rules: WAFRule[] = [];
    this.wafRules.forEach((rule) => {
      rules.push(rule);
    });
    return rules;
  }

  /**
   * 更新 DDoS 配置
   */
  updateDDoSConfig(config: Partial<DDoSConfig>): void {
    this.ddosConfig = { ...this.ddosConfig, ...config };
  }

  /**
   * 获取 DDoS 配置
   */
  getDDoSConfig(): DDoSConfig {
    return this.ddosConfig;
  }

  /**
   * 获取安全头
   */
  getSecurityHeaders(): SecurityHeaders {
    return this.securityHeaders;
  }

  /**
   * 更新安全头
   */
  updateSecurityHeaders(headers: Partial<SecurityHeaders>): void {
    this.securityHeaders = { ...this.securityHeaders, ...headers };
  }

  /**
   * 获取网络分段配置
   */
  getNetworkSegmentation(): NetworkSegmentation {
    return this.networkSegmentation;
  }

  /**
   * 添加 IDS/IPS 规则
   */
  addIDSIPSRule(rule: IDSIPSRule): void {
    this.idsipsRules.set(rule.id, rule);
  }

  /**
   * 获取所有 IDS/IPS 规则
   */
  getIDSIPSRules(): IDSIPSRule[] {
    const rules: IDSIPSRule[] = [];
    this.idsipsRules.forEach((rule) => {
      rules.push(rule);
    });
    return rules;
  }

  /**
   * 生成安全报告
   */
  generateSecurityReport(): {
    wafRulesCount: number;
    idsipsRulesCount: number;
    ddosProtectionEnabled: boolean;
    securityHeadersCount: number;
    networkSegments: number;
  } {
    return {
      wafRulesCount: this.wafRules.size,
      idsipsRulesCount: this.idsipsRules.size,
      ddosProtectionEnabled: this.ddosConfig.enabled,
      securityHeadersCount: Object.keys(this.securityHeaders).length,
      networkSegments: Object.keys(this.networkSegmentation).length,
    };
  }

  /**
   * 获取攻击统计
   */
  getAttackStatistics(): {
    totalRequests: number;
    blockedRequests: number;
    uniqueAttackers: number;
  } {
    let totalRequests = 0;
    let uniqueAttackers = 0;

    this.requestCounts.forEach((timestamps) => {
      totalRequests += timestamps.length;
      uniqueAttackers++;
    });

    return {
      totalRequests,
      blockedRequests: 0, // 需要单独追踪
      uniqueAttackers,
    };
  }

  /**
   * 清空请求计数
   */
  clearRequestCounts(): void {
    this.requestCounts.clear();
  }
}

/**
 * 创建单例实例
 */
let infrastructureManager: InfrastructureHardeningManager | null = null;

export function getInfrastructureManager(): InfrastructureHardeningManager {
  if (!infrastructureManager) {
    infrastructureManager = new InfrastructureHardeningManager();
  }
  return infrastructureManager;
}
