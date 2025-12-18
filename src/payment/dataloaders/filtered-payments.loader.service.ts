import { CustomizableLoader } from '../../graphql/dataloaders/customizable.loader';
import { PaymentsFilter } from '../dto';

export abstract class FilteredPaymentsLoader<K, V> extends CustomizableLoader<K, V, string, PaymentsFilter> {
  protected serializeOptions(options: PaymentsFilter): string {
    const { dateFrom, dateTo } = options || {};

    const dateFromStr = dateFrom ? dateFrom.toISOString().split('T')[0] : 'NULL';
    const dateToStr = dateTo ? dateTo.toISOString().split('T')[0] : 'NULL';

    return `${dateFromStr}:${dateToStr}`;
  }
}