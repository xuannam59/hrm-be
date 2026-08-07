import { Injectable } from '@nestjs/common';
import axios from 'axios';
import {
  UploadApiErrorResponse,
  UploadApiResponse,
  v2 as cloudinary,
} from 'cloudinary';

@Injectable()
export class CloudinaryService {
  uploadFile(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise<UploadApiResponse | UploadApiErrorResponse>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'raw',
          },
          (error, uploadResult) => {
            if (error) {
              return reject(new Error(error.message));
            }
            return resolve(uploadResult as UploadApiResponse);
          },
        );

        uploadStream.end(file.buffer);
      },
    );
  }

  async getFile(url: string): Promise<Buffer> {
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'arraybuffer',
    });

    return response.data;
  }
}
