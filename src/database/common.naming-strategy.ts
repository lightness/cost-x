import { snakeCase } from 'change-case';
import { DefaultNamingStrategy, NamingStrategyInterface, Table } from 'typeorm';

export class CommonNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
  name: 'Common';

  tableName(targetName: string, userSpecifiedName: string): string {
    return userSpecifiedName || snakeCase(targetName);
  }

  columnName(propertyName: string, customName: string, embeddedPrefixes: string[]): string {
    return (
      snakeCase(embeddedPrefixes.concat('').join('_')) +
      (customName ? customName : snakeCase(propertyName))
    );
  }

  joinColumnName(relationName: string, referencedColumnName: string): string {
    return snakeCase(relationName + '_' + referencedColumnName);
  }

  relationName(propertyName: string): string {
    return propertyName;
  }

  primaryKeyName(tableOrName: string | Table, columnNames: string[]): string {
    return `PK_${this.getTableName(tableOrName)}_${this.joinColumns(columnNames)}`;
  }

  uniqueConstraintName(tableOrName: Table | string, columnNames: string[]): string {
    return `UQ_${this.getTableName(tableOrName)}_${this.joinColumns(columnNames)}`;
  }

  foreignKeyName(
    referencingTableOrName: Table | string,
    referencingColumnNames: string[],
    referencedTablePath?: string,
    referencedColumnNames?: string[],
  ): string {
    const referencingTableName = this.getTableName(referencingTableOrName);

    const referencingReferencedGroup = referencingColumnNames.map((referencingColumn, index) => {
      return `${referencingTableName}_${referencingColumn}_${referencedTablePath}_${referencedColumnNames[index]}`;
    });

    return `FK_${referencingReferencedGroup.join('_')}`;
  }

  indexName(tableOrName: Table | string, columnNames: string[]): string {
    return `IDX_${this.getTableName(tableOrName)}_${this.joinColumns(columnNames)}`;
  }

  private joinColumns(columnNames: string[]): string {
    return columnNames.join('_');
  }
}
