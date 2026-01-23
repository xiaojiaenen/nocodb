import {
  isUniqueConstraintSupportedType,
  UITypes,
  UNIQUE_CONSTRAINT_SUPPORTED_TYPES,
} from 'nocodb-sdk';
import type { NcContext } from '~/interface/config';
import type { Source } from '~/models';
import { NcError } from '~/helpers/catchError';

// Re-export from SDK
export { isUniqueConstraintSupportedType, UNIQUE_CONSTRAINT_SUPPORTED_TYPES };

/**
 * Validates unique constraint request and throws error if invalid
 * @param context - 星澜 上下文
 * @param uidt - UI 数据类型
 * @param meta - 列元数据
 * @param unique - 唯一约束值
 * @param source - 源对象以检查是否为 星澜 数据库
 * @param cdf - 列默认值（用于检查互斥性）
 */
export function validateUniqueConstraint(
  context: NcContext,
  uidt: UITypes,
  meta?: any,
  unique?: boolean,
  source?: Pick<Source, 'is_local' | 'is_meta'>,
  cdf?: string,
): void {
  if (!unique) return; // 如果未设置唯一性，则无需验证

  // 检查源是否为 星澜 数据库（元数据或本地）
  if (source && !source.is_meta && !source.is_local) {
    NcError.get(context).badRequest(
      '唯一约束仅支持 星澜 数据库（不支持外部数据库）',
    );
  }

  // 检查字段类型是否支持唯一约束
  if (!isUniqueConstraintSupportedType(uidt, meta)) {
    const fieldTypeName = UITypes[uidt] || uidt;
    NcError.get(context).badRequest(
      `字段类型 '${fieldTypeName}' 不支持唯一约束`,
    );
  }

  // 检查是否设置了默认值（与唯一约束互斥）
  if (cdf !== null && cdf !== undefined && cdf !== '') {
    NcError.get(context).badRequest(
      '无法启用唯一约束，因为已设置默认值。请先删除默认值。',
    );
  }
}

/**
 * Normalizes value for unique constraint comparison
 * Handles case-insensitive comparison and whitespace trimming
 * @param value - Value to normalize
 * @param uidt - UI data type
 * @returns normalized value
 */
export function normalizeValueForUniqueCheck(value: any, uidt: UITypes): any {
  if (value === null || value === undefined || value === '') {
    return null; // Treat empty values as null
  }

  // For text-based fields, trim whitespace and convert to lowercase
  if (
    [
      UITypes.SingleLineText,
      UITypes.Email,
      UITypes.PhoneNumber,
      UITypes.URL,
    ].includes(uidt)
  ) {
    return String(value).trim().toLowerCase();
  }

  return value;
}
