import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export const storageService = {
    async uploadImage(file: File, path: string): Promise<string> {
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
    },

    async uploadProductImages(bizId: string, files: File[]): Promise<string[]> {
        const uploadPromises = files.map(file => {
            const fileName = `${Date.now()}_${file.name}`;
            const path = `businesses/${bizId}/products/${fileName}`;
            return this.uploadImage(file, path);
        });
        return Promise.all(uploadPromises);
    }
};
