import { describe, it, expect, beforeEach } from 'vitest';
import {
  InfrastructureHardeningManager,
  getInfrastructureManager,
} from './infrastructureHardening';

describe('Infrastructure Hardening', () => {
  let manager: InfrastructureHardeningManager;

  beforeEach(() => {
    manager = new InfrastructureHardeningManager();
  });

  describe('DDoS Protection', () => {
    it('should detect DDoS attacks', () => {
      const clientIP = '192.168.1.1';
      const result = manager.checkDDoSAttack(clientIP);
      expect(result).toHaveProperty('isAttack');
      expect(result).toHaveProperty('action');
    });

    it('should allow requests below threshold', () => {
      const result = manager.checkDDoSAttack('192.168.1.1');
      expect(result.isAttack).toBe(false);
      expect(result.action).toBe('allow');
    });

    it('should block blacklisted IPs', () => {
      const config = manager.getDDoSConfig();
      config.blacklistIPs.push('192.168.1.2');
      manager.updateDDoSConfig(config);

      const result = manager.checkDDoSAttack('192.168.1.2');
      expect(result.isAttack).toBe(true);
      expect(result.action).toBe('block');
    });

    it('should allow whitelisted IPs', () => {
      const config = manager.getDDoSConfig();
      config.whitelistIPs.push('192.168.1.3');
      manager.updateDDoSConfig(config);

      const result = manager.checkDDoSAttack('192.168.1.3');
      expect(result.isAttack).toBe(false);
      expect(result.action).toBe('allow');
    });
  });

  describe('WAF Rules', () => {
    it('should detect SQL injection', () => {
      const result = manager.checkWAFRules("'; DROP TABLE users; --");
      expect(result.blocked).toBe(true);
    });

    it('should detect XSS attacks', () => {
      const result = manager.checkWAFRules('<script>alert("XSS")</script>');
      expect(result.blocked).toBe(true);
    });

    it('should detect path traversal', () => {
      const result = manager.checkWAFRules('../../../etc/passwd');
      expect(result.blocked).toBe(true);
    });

    it('should allow clean input', () => {
      const result = manager.checkWAFRules('normal user input');
      expect(result.blocked).toBe(false);
    });

    it('should add custom WAF rules', () => {
      const rule = {
        id: 'custom_rule',
        name: 'Custom Rule',
        description: 'Test rule',
        pattern: 'test',
        action: 'block' as const,
        priority: 10,
        enabled: true,
      };

      manager.addWAFRule(rule);
      const rules = manager.getWAFRules();
      expect(rules.some((r) => r.id === 'custom_rule')).toBe(true);
    });

    it('should remove WAF rules', () => {
      manager.removeWAFRule('waf_sql_injection');
      const rules = manager.getWAFRules();
      expect(rules.some((r) => r.id === 'waf_sql_injection')).toBe(false);
    });
  });

  describe('Security Headers', () => {
    it('should provide security headers', () => {
      const headers = manager.getSecurityHeaders();
      expect(headers).toHaveProperty('Content-Security-Policy');
      expect(headers).toHaveProperty('X-Content-Type-Options');
      expect(headers).toHaveProperty('X-Frame-Options');
      expect(headers).toHaveProperty('X-XSS-Protection');
      expect(headers).toHaveProperty('Strict-Transport-Security');
    });

    it('should update security headers', () => {
      const newHeaders = {
        'X-Frame-Options': 'SAMEORIGIN',
      };
      manager.updateSecurityHeaders(newHeaders);
      const headers = manager.getSecurityHeaders();
      expect(headers['X-Frame-Options']).toBe('SAMEORIGIN');
    });

    it('should maintain other headers when updating', () => {
      const originalHeaders = manager.getSecurityHeaders();
      manager.updateSecurityHeaders({ 'X-Frame-Options': 'SAMEORIGIN' });
      const updatedHeaders = manager.getSecurityHeaders();

      expect(updatedHeaders['Content-Security-Policy']).toBe(
        originalHeaders['Content-Security-Policy']
      );
    });
  });

  describe('Network Segmentation', () => {
    it('should provide network segmentation', () => {
      const segmentation = manager.getNetworkSegmentation();
      expect(segmentation).toHaveProperty('publicZone');
      expect(segmentation).toHaveProperty('applicationZone');
      expect(segmentation).toHaveProperty('databaseZone');
      expect(segmentation).toHaveProperty('managementZone');
    });

    it('should have valid CIDR blocks', () => {
      const segmentation = manager.getNetworkSegmentation();
      const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;

      for (const zone of Object.values(segmentation)) {
        for (const cidr of zone) {
          expect(cidrRegex.test(cidr) || cidr === '0.0.0.0/0').toBe(true);
        }
      }
    });
  });

  describe('IDS/IPS Rules', () => {
    it('should provide IDS/IPS rules', () => {
      const rules = manager.getIDSIPSRules();
      expect(rules.length).toBeGreaterThan(0);
    });

    it('should add IDS/IPS rules', () => {
      const rule = {
        id: 'custom_ids_rule',
        name: 'Custom IDS Rule',
        signature: 'test_signature',
        severity: 'high' as const,
        action: 'alert' as const,
        enabled: true,
      };

      manager.addIDSIPSRule(rule);
      const rules = manager.getIDSIPSRules();
      expect(rules.some((r) => r.id === 'custom_ids_rule')).toBe(true);
    });

    it('should have valid severity levels', () => {
      const rules = manager.getIDSIPSRules();
      const validSeverities = ['critical', 'high', 'medium', 'low'];

      for (const rule of rules) {
        expect(validSeverities).toContain(rule.severity);
      }
    });
  });

  describe('DDoS Configuration', () => {
    it('should get DDoS config', () => {
      const config = manager.getDDoSConfig();
      expect(config).toHaveProperty('enabled');
      expect(config).toHaveProperty('threshold');
      expect(config).toHaveProperty('blockDuration');
    });

    it('should update DDoS config', () => {
      const newConfig = {
        threshold: 500,
        blockDuration: 600,
      };
      manager.updateDDoSConfig(newConfig);
      const config = manager.getDDoSConfig();

      expect(config.threshold).toBe(500);
      expect(config.blockDuration).toBe(600);
    });

    it('should maintain other config values when updating', () => {
      const originalConfig = manager.getDDoSConfig();
      manager.updateDDoSConfig({ threshold: 500 });
      const updatedConfig = manager.getDDoSConfig();

      expect(updatedConfig.enabled).toBe(originalConfig.enabled);
      expect(updatedConfig.blockDuration).toBe(originalConfig.blockDuration);
    });
  });

  describe('Security Report', () => {
    it('should generate security report', () => {
      const report = manager.generateSecurityReport();
      expect(report).toHaveProperty('wafRulesCount');
      expect(report).toHaveProperty('idsipsRulesCount');
      expect(report).toHaveProperty('ddosProtectionEnabled');
      expect(report).toHaveProperty('securityHeadersCount');
      expect(report).toHaveProperty('networkSegments');
    });

    it('should have positive rule counts', () => {
      const report = manager.generateSecurityReport();
      expect(report.wafRulesCount).toBeGreaterThan(0);
      expect(report.idsipsRulesCount).toBeGreaterThan(0);
      expect(report.securityHeadersCount).toBeGreaterThan(0);
      expect(report.networkSegments).toBeGreaterThan(0);
    });

    it('should show DDoS protection status', () => {
      const report = manager.generateSecurityReport();
      expect(typeof report.ddosProtectionEnabled).toBe('boolean');
    });
  });

  describe('Attack Statistics', () => {
    it('should get attack statistics', () => {
      const stats = manager.getAttackStatistics();
      expect(stats).toHaveProperty('totalRequests');
      expect(stats).toHaveProperty('blockedRequests');
      expect(stats).toHaveProperty('uniqueAttackers');
    });

    it('should track unique attackers', () => {
      manager.checkDDoSAttack('192.168.1.1');
      manager.checkDDoSAttack('192.168.1.2');
      manager.checkDDoSAttack('192.168.1.3');

      const stats = manager.getAttackStatistics();
      expect(stats.uniqueAttackers).toBe(3);
    });

    it('should clear request counts', () => {
      manager.checkDDoSAttack('192.168.1.1');
      manager.clearRequestCounts();

      const stats = manager.getAttackStatistics();
      expect(stats.totalRequests).toBe(0);
      expect(stats.uniqueAttackers).toBe(0);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const manager1 = getInfrastructureManager();
      const manager2 = getInfrastructureManager();
      expect(manager1).toBe(manager2);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete security flow', () => {
      // Test DDoS detection
      const ddosResult = manager.checkDDoSAttack('192.168.1.1');
      expect(ddosResult.action).toBe('allow');

      // Test WAF rules
      const wafResult = manager.checkWAFRules('normal input');
      expect(wafResult.blocked).toBe(false);

      // Generate report
      const report = manager.generateSecurityReport();
      expect(report.wafRulesCount).toBeGreaterThan(0);
    });

    it('should block malicious requests', () => {
      // SQL injection
      const sqlResult = manager.checkWAFRules("'; DROP TABLE users; --");
      expect(sqlResult.blocked).toBe(true);

      // XSS
      const xssResult = manager.checkWAFRules('<script>alert("XSS")</script>');
      expect(xssResult.blocked).toBe(true);

      // Path traversal
      const pathResult = manager.checkWAFRules('../../../etc/passwd');
      expect(pathResult.blocked).toBe(true);
    });

    it('should maintain security posture', () => {
      const report1 = manager.generateSecurityReport();
      manager.checkDDoSAttack('192.168.1.1');
      manager.checkWAFRules('test input');
      const report2 = manager.generateSecurityReport();

      // Security posture should not change with normal operations
      expect(report1.wafRulesCount).toBe(report2.wafRulesCount);
      expect(report1.idsipsRulesCount).toBe(report2.idsipsRulesCount);
    });
  });
});
