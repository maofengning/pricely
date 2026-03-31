import { UserProfile } from '@/components/Auth';
import { Settings } from '@/components/Auth';

export default function ProfilePage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-6">个人中心</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <UserProfile />
        <Settings />
      </div>
    </div>
  );
}