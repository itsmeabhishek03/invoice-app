// components/ui/Avatar.tsx
'use client';

import Image from 'next/image';
import { FC } from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: number;
}

const Avatar: FC<AvatarProps> = ({
  src = '/default-avatar.png',
  alt = 'User avatar',
  size = 32,
}) => (
  <Image
    src={src}
    alt={alt}
    width={size}
    height={size}
    className="rounded-full object-cover"
  />
);

export default Avatar;
