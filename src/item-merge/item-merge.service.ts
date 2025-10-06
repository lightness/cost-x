import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { Item, ItemTag, Payment } from '../database/entities';

@Injectable()
export class ItemMergeService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  // TODO: Use @Transactional decorator
  async merge(hostItem: Item, mergingItem: Item) {
    return await this.dataSource.transaction(async (entityManager: EntityManager) => {
      const paymentRepository = await entityManager.getRepository(Payment);
      const itemRepository = await entityManager.getRepository(Item);
      const itemTagRepository = await entityManager.getRepository(ItemTag);

      const mergingPayments = await paymentRepository.findBy({ itemId: mergingItem.id });

      await paymentRepository.save(mergingPayments.map((payment) => ({ 
        ...payment, 
        title: payment.title || mergingItem.title, 
        itemId: hostItem.id,
      })));

      await itemTagRepository.delete({ itemId: mergingItem.id });
      await itemRepository.remove(mergingItem);

      return {
        item: await itemRepository.findOneBy({ id: hostItem.id }),
        payments: await paymentRepository.findBy({ itemId: hostItem.id }),
      };
    });
  }
}