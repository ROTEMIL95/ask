import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function BetaBadge() {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg animate-pulse cursor-help">
                        BETA
                    </span>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="text-sm">This platform is currently in beta version</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
