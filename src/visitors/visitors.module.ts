import { Module } from '@nestjs/common';
import { VisitorsController } from './visitors.controller';
import { VisitorsService } from './visitors.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Visitor, VisitorSchema } from './schema/visitor.schema';
import { VisitorRepository } from './visitors.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Visitor.name, schema: VisitorSchema }]),
  ],
  controllers: [VisitorsController],
  providers: [VisitorsService, VisitorRepository],
})
export class VisitorsModule {}
