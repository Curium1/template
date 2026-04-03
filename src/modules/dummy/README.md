# Dummy Module

**Key:** `dummy`  
**Version:** `1.0.0`  
**Dependencies:** None

## Purpose

Proof-of-concept module that demonstrates the module contract. Use this as a template when creating new modules.

## Permissions

| Key | Description |
|-----|-------------|
| `dummy.view` | View dummy items |
| `dummy.create` | Create new dummy items |
| `dummy.edit` | Edit existing dummy items |
| `dummy.delete` | Delete dummy items |
| `dummy.admin` | Administrate the dummy module |

## Pages

| Path | Permission | Component |
|------|-----------|-----------|
| `/dummy` | `dummy.view` | `DummyListPage` |

## Creating a New Module from This Template

1. Copy this folder to `src/modules/<your_key>/`
2. Update `permissions.ts` with your permissions
3. Update `module.config.ts` with your key, name, routes, and navigation
4. Create your page components in `pages/`
5. Add i18n keys in `src/core/shared/i18n/i18n.ts`
6. Add role→permission mappings in `src/core/authorization/services/permissionResolver.ts`
