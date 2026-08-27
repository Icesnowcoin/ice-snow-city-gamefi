import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PROFESSION_CONFIG, ProfessionType } from '@shared/types/profession';

interface ProfessionPanelProps {
  profession: {
    currentProfession: ProfessionType;
    level: number;
    experience: number;
    nextLevelExperience: number;
    totalAssets: number;
    canUpgrade?: {
      required: {
        assets: number;
        level: number;
      };
      current: {
        assets: number;
        level: number;
      };
      canUpgrade: boolean;
    };
  };
  onUpgrade?: () => void;
  isLoading?: boolean;
}

/**
 * Profession Panel Component
 * Displays player profession, level, experience, and upgrade options
 */
export const ProfessionPanel: React.FC<ProfessionPanelProps> = ({
  profession,
  onUpgrade,
  isLoading = false,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const currentProfessionInfo = PROFESSION_CONFIG[profession.currentProfession];
  const experienceProgress = (profession.experience / profession.nextLevelExperience) * 100;

  // Get all professions in order
  const allProfessions = Object.values(ProfessionType).map(
    (type) => PROFESSION_CONFIG[type as ProfessionType]
  );
  const currentIndex = allProfessions.findIndex(
    (p) => p.type === profession.currentProfession
  );

  return (
    <div className="w-full space-y-4">
      {/* Current Profession Card */}
      <Card className="p-6 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{currentProfessionInfo.emoji}</div>
            <div>
              <h3 className="text-xl font-bold text-white">
                {currentProfessionInfo.name}
              </h3>
              <p className="text-sm text-gray-300">
                {currentProfessionInfo.description}
              </p>
            </div>
          </div>
          <Badge className="bg-blue-500 text-white px-3 py-1">
            Lv. {profession.level}
          </Badge>
        </div>

        {/* Experience Bar */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Experience</span>
            <span className="text-blue-300">
              {profession.experience} / {profession.nextLevelExperience}
            </span>
          </div>
          <Progress value={experienceProgress} className="h-2" />
        </div>

        {/* Assets Display */}
        <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg mb-4">
          <span className="text-gray-300">Total Assets</span>
          <span className="text-lg font-bold text-yellow-400">
            {profession.totalAssets.toLocaleString()} ISC
          </span>
        </div>

        {/* Profession Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-2 bg-black/20 rounded text-center">
            <p className="text-xs text-gray-400">Profit Bonus</p>
            <p className="text-sm font-bold text-green-400">
              +{currentProfessionInfo.stats.profitBonus}%
            </p>
          </div>
          <div className="p-2 bg-black/20 rounded text-center">
            <p className="text-xs text-gray-400">Production Bonus</p>
            <p className="text-sm font-bold text-blue-400">
              +{currentProfessionInfo.stats.productionBonus}%
            </p>
          </div>
          <div className="p-2 bg-black/20 rounded text-center">
            <p className="text-xs text-gray-400">Building Capacity</p>
            <p className="text-sm font-bold text-purple-400">
              {currentProfessionInfo.stats.buildingCapacity}
            </p>
          </div>
          <div className="p-2 bg-black/20 rounded text-center">
            <p className="text-xs text-gray-400">Worker Capacity</p>
            <p className="text-sm font-bold text-orange-400">
              {currentProfessionInfo.stats.workerCapacity}
            </p>
          </div>
        </div>

        {/* Details Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide Details' : 'View All Stats'}
        </Button>
      </Card>

      {/* Detailed Stats */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-4 bg-black/30 border-gray-600/30">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400">Harvest Bonus</p>
                  <p className="text-sm font-bold text-green-300">
                    +{currentProfessionInfo.stats.harvestBonus}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Trade Bonus</p>
                  <p className="text-sm font-bold text-blue-300">
                    +{currentProfessionInfo.stats.tradeBonus}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Bank Interest Bonus</p>
                  <p className="text-sm font-bold text-yellow-300">
                    +{currentProfessionInfo.stats.bankInterestBonus}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Experience Multiplier</p>
                  <p className="text-sm font-bold text-purple-300">
                    x{currentProfessionInfo.stats.experienceMultiplier}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profession Progression Path */}
      <Card className="p-4 bg-black/20 border-gray-600/30">
        <h4 className="text-sm font-bold text-white mb-3">Profession Path</h4>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {allProfessions.map((prof, index) => {
            const isCurrentOrPassed = index <= currentIndex;
            const isCurrent = prof.type === profession.currentProfession;

            return (
              <motion.div
                key={prof.type}
                className="flex items-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                    isCurrent
                      ? 'bg-blue-500/30 border border-blue-400'
                      : isCurrentOrPassed
                        ? 'bg-green-500/20 border border-green-400/50'
                        : 'bg-gray-700/20 border border-gray-600/30'
                  }`}
                >
                  <span className="text-2xl">{prof.emoji}</span>
                  <span className="text-xs font-bold text-white mt-1">
                    {prof.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    Lv.{prof.unlockLevel}
                  </span>
                </div>

                {index < allProfessions.length - 1 && (
                  <div
                    className={`w-8 h-1 mx-1 ${
                      isCurrentOrPassed ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* Upgrade Card */}
      {profession.canUpgrade && currentIndex < allProfessions.length - 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card
            className={`p-4 ${
              profession.canUpgrade.canUpgrade
                ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/50'
                : 'bg-gradient-to-br from-red-900/20 to-orange-900/20 border-red-500/30'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-white">
                {profession.canUpgrade.canUpgrade
                  ? '✨ Ready to Upgrade!'
                  : 'Upgrade Requirements'}
              </h4>
              {profession.canUpgrade.canUpgrade && (
                <Badge className="bg-green-500 text-white">Available</Badge>
              )}
            </div>

            <div className="space-y-2 mb-4">
              {/* Level Requirement */}
              <div className="flex items-center justify-between p-2 bg-black/20 rounded">
                <span className="text-sm text-gray-300">Level Required</span>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      profession.canUpgrade.current.level >=
                      profession.canUpgrade.required.level
                        ? 'text-green-400'
                        : 'text-red-400'
                    }
                  >
                    {profession.canUpgrade.current.level}
                  </span>
                  <span className="text-gray-500">/</span>
                  <span className="text-gray-300">
                    {profession.canUpgrade.required.level}
                  </span>
                </div>
              </div>

              {/* Assets Requirement */}
              <div className="flex items-center justify-between p-2 bg-black/20 rounded">
                <span className="text-sm text-gray-300">Assets Required</span>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      profession.canUpgrade.current.assets >=
                      profession.canUpgrade.required.assets
                        ? 'text-green-400'
                        : 'text-red-400'
                    }
                  >
                    {profession.canUpgrade.current.assets.toLocaleString()}
                  </span>
                  <span className="text-gray-500">/</span>
                  <span className="text-gray-300">
                    {profession.canUpgrade.required.assets.toLocaleString()} ISC
                  </span>
                </div>
              </div>
            </div>

            {/* Upgrade Button */}
            {profession.canUpgrade.canUpgrade && onUpgrade && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Upgrading...' : 'Upgrade Profession'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Profession Upgrade</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you ready to upgrade to{' '}
                      <span className="font-bold text-white">
                        {allProfessions[currentIndex + 1]?.name}
                      </span>
                      ? This will unlock new abilities and bonuses.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="flex gap-3">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onUpgrade}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Upgrade
                    </AlertDialogAction>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default ProfessionPanel;
