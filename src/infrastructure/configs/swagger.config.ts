import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';

export const setupSwagger = (app: INestApplication) => {
  const config = new DocumentBuilder()
    .setTitle('Human Resource Manager')
    .setDescription('Human Resource Manager API')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'Bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'token',
    )
    .addSecurityRequirements('token')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  // // Lưu file swagger.json vào thư mục gốc của dự án
  // writeFileSync('./swagger.json', JSON.stringify(document, null, 2));
  SwaggerModule.setup('api/docs', app, document);
};
