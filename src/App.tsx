import React, { useState, useMemo } from 'react';
import {
  RefreshCw,
  Mail,
  CheckSquare,
  Square,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Users,
  Award,
  Search,
  Filter,
  ChevronRight,
  Clock,
  Edit3,
  Send,
  History,
  X,
  Building2,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Info,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Calendar
} from 'lucide-react';

// ==========================================
// 1. DATA & DOMAIN TYPES
// ==========================================

export interface RawMember {
  id: string;
  org: string;
  executive: string;
  team: string;
  name: string;
  rank: 'G1' | 'G2' | 'G3';
  badges: string[];
}

export interface MemberProcess extends RawMember {
  missingBadges: string[];
  isFulfilled: boolean;
  deficientCount: number;
}

export interface EmailRecord {
  id: string;
  date: string;
  sender: string;
  subject: string;
  recipient: string;
  targetCount?: number;
  preview: string;
}

// Badge system dictionary
export const BADGE_DICT: Record<string, { category: string; levelName: string; fullName: string; color: string }> = {
  DS: { category: 'Data Science', levelName: '데이터 사이언스', fullName: 'Data Science', color: 'blue' },
  CL: { category: 'Citizen Dev', levelName: '시티즌 개발', fullName: 'Citizen Developer', color: 'emerald' },
  DA: { category: 'Data Analytics', levelName: '데이터 분석', fullName: 'Data Analytics', color: 'indigo' },
  PE: { category: 'Prompt Eng', levelName: '프롬프트 엔지니어링', fullName: 'Prompt Engineering', color: 'purple' },
  DV: { category: 'Data Viz', levelName: '데이터 시각화', fullName: 'Data Visualization', color: 'cyan' },
  PP: { category: 'Python', levelName: '파이썬 프로그래밍', fullName: 'Python Programming', color: 'amber' },
  ML: { category: 'Machine Learning', levelName: '머신러닝', fullName: 'Machine Learning', color: 'violet' },
  AU: { category: 'Automation', levelName: '업무 자동화', fullName: 'Automation', color: 'teal' },
  TB: { category: 'Tableau', levelName: '태블로', fullName: 'Tableau', color: 'orange' },
  DOE: { category: 'DOE', levelName: '실험계획법', fullName: 'Design of Experiments', color: 'rose' }
};

export const LEVEL_NAMES: Record<string, string> = {
  Y: 'Yellow',
  G: 'Green',
  B: 'Blue',
  SC: 'Silver Champion',
  GC: 'Gold Champion'
};

export const LEVEL_WEIGHT: Record<string, number> = {
  Y: 1,
  G: 2,
  B: 3,
  SC: 4,
  GC: 5
};

// Mandatory badge requirements from standard criteria
export const REQ_MAP: Record<'G1' | 'G2' | 'G3', string[]> = {
  G1: ['DS_G', 'CL_G', 'DA_G', 'PE_G', 'DV_G'],
  G2: ['DA_B', 'PP_G', 'ML_G', 'AU_B'],
  G3: ['ML_B', 'AU_B', 'PP_B']
};

export function parseBadge(badgeStr: string): { cat: string; level: string } {
  const parts = badgeStr.split('_');
  if (parts.length === 2) {
    return { cat: parts[0], level: parts[1] };
  }
  return { cat: badgeStr, level: '' };
}

export function hasBadgeQualified(userBadges: string[], reqBadge: string): boolean {
  const { cat: reqCat, level: reqLevel } = parseBadge(reqBadge);
  const reqWeight = LEVEL_WEIGHT[reqLevel] || 0;
  for (const b of userBadges) {
    const { cat: bCat, level: bLevel } = parseBadge(b);
    if (bCat === reqCat) {
      if ((LEVEL_WEIGHT[bLevel] || 0) >= reqWeight) {
        return true;
      }
    }
  }
  return false;
}

// Packed raw members data (generated from the new PDF dataset)
const PACKED_MEMBERS_DATA: string[] = ["emp_1|DX센터|강임원|사업7팀|박수아|G1|AU_Y,PE_G,ML_Y,TB_Y", "emp_2|DX센터|강임원|사업7팀|송민서|G1|CL_Y,TB_Y,DV_G,DA_Y", "emp_3|DX센터|강임원|사업7팀|송수빈|G1|DA_Y,CL_B,AU_Y,DS_GC,DOE_SC,DV_B,PP_SC,ML_SC,PE_Y", "emp_4|DX센터|강임원|사업7팀|송준우|G1|DV_Y,PE_Y,DS_Y,TB_G", "emp_5|DX센터|강임원|사업7팀|장서윤|G1|DA_Y,AU_G,DOE_G,CL_Y", "emp_6|DX센터|강임원|사업7팀|장지호|G1|DS_G,DA_G,PE_Y,TB_G", "emp_7|DX센터|강임원|사업7팀|한민서|G1|ML_G,DS_G,DV_G,PE_Y", "emp_8|DX센터|강임원|사업7팀|박주원|G2|TB_Y,PE_SC,DS_B,CL_SC,AU_B,DA_G,ML_G,PP_GC", "emp_9|DX센터|강임원|사업7팀|윤시우|G2|TB_Y,PP_Y,DV_Y,AU_G", "emp_10|DX센터|강임원|사업7팀|정민준|G2|DA_Y,PE_B,TB_B,CL_Y,AU_GC,DV_Y,PP_SC,DOE_GC,ML_GC", "emp_11|DX센터|강임원|사업7팀|최주원|G2|PP_SC,DV_GC,TB_Y,ML_G,DS_SC,DOE_Y", "emp_12|DX센터|강임원|사업7팀|홍지유|G2|TB_G,DS_G,PP_G,AU_SC,DOE_SC,DA_B", "emp_13|DX센터|강임원|사업7팀|강지유|G3|AU_Y,PE_Y,DA_Y,TB_Y", "emp_14|DX센터|강임원|사업7팀|안지아|G3|AU_G,PE_B,TB_GC,DA_B,DV_B,ML_G", "emp_15|DX센터|강임원|사업7팀|윤하윤|G3|PE_G,DS_Y,DOE_SC,CL_GC,PP_Y,DV_Y", "emp_16|DX센터|강임원|사업7팀|조준우|G3|CL_Y,DS_Y,DA_B,DV_Y,PE_Y,ML_G", "emp_17|DX센터|강임원|사업7팀|최민서|G3|TB_Y,AU_G,DA_G,DOE_Y", "emp_18|DX센터|강임원|사업7팀|한채원|G3|TB_Y,DV_SC,PP_B,AU_G,DOE_G,DA_G", "emp_19|DX센터|서임원|관리5팀|신수빈|G1|DA_Y,ML_G,AU_Y,DOE_Y", "emp_20|DX센터|서임원|관리5팀|안시우|G1|AU_Y,DV_G,PP_Y,PE_Y", "emp_21|DX센터|서임원|관리5팀|안예은|G1|ML_Y,DA_Y,PP_Y,AU_Y", "emp_22|DX센터|서임원|관리5팀|오민서|G1|TB_Y,PE_Y,DS_Y,AU_Y", "emp_23|DX센터|서임원|관리5팀|윤지민|G1|DA_B,CL_B,PE_B,DS_SC,DOE_SC,PP_Y", "emp_24|DX센터|서임원|관리5팀|정수아|G1|DA_G,AU_Y,CL_Y,DOE_G,PP_Y,ML_B", "emp_25|DX센터|서임원|관리5팀|황민서|G1|PP_Y,TB_Y,DOE_GC,DS_Y,ML_B,DV_G", "emp_26|DX센터|서임원|관리5팀|황서현|G1|PE_Y,CL_G,AU_Y,DA_Y", "emp_27|DX센터|서임원|관리5팀|황하준|G1|PE_Y,DOE_Y,TB_G,CL_Y", "emp_28|DX센터|서임원|관리5팀|서서윤|G2|PE_G,CL_Y,DV_Y,TB_Y", "emp_29|DX센터|서임원|관리5팀|정민준|G2|DOE_GC,DA_G,PE_SC,PP_GC,DV_Y,TB_B", "emp_30|DX센터|서임원|관리5팀|정민준|G2|DV_Y,TB_G,DA_Y,PE_Y", "emp_31|DX센터|서임원|관리5팀|정서연|G2|DV_G,TB_Y,CL_Y,DA_Y", "emp_32|DX센터|서임원|관리5팀|최시우|G2|PP_G,CL_Y,DA_G,ML_Y", "emp_33|DX센터|서임원|관리5팀|한하윤|G2|PP_G,DA_B,TB_GC,AU_B,ML_GC,DS_B,DOE_SC,PE_SC,DV_SC,CL_B", "emp_34|DX센터|서임원|관리5팀|강예은|G3|PP_G,DA_Y,PE_G,DOE_Y", "emp_35|DX센터|서임원|관리5팀|신민서|G3|DOE_Y,AU_G,DS_Y,PE_G,PP_G,CL_SC", "emp_36|DX센터|서임원|관리5팀|조서연|G3|PE_Y,AU_G,TB_G,DV_G", "emp_37|DX센터|서임원|관리5팀|최수아|G3|DS_Y,PP_Y,ML_G,DOE_Y", "emp_38|DX센터|서임원|관리5팀|한주원|G3|DA_Y,AU_Y,PE_Y,DOE_Y", "emp_39|DX센터|안임원|AX6팀|권지민|G2|AU_Y,PP_Y,PE_Y,ML_G", "emp_40|DX센터|안임원|AX6팀|김다은|G2|ML_G,DS_Y,DV_B,DOE_Y,DA_G,PE_GC", "emp_41|DX센터|안임원|AX6팀|김윤서|G2|PP_Y,CL_G,ML_Y,AU_G", "emp_42|DX센터|안임원|AX6팀|김채원|G2|DS_G,TB_G,DV_Y,PP_G", "emp_43|DX센터|안임원|AX6팀|송민서|G2|DS_G,ML_G,DV_G,PP_Y", "emp_44|DX센터|안임원|AX6팀|안서윤|G2|TB_G,CL_G,AU_G,PE_G", "emp_45|DX센터|안임원|AX6팀|오예준|G2|CL_Y,DA_Y,ML_Y,AU_Y", "emp_46|DX센터|안임원|AX6팀|오지훈|G2|PE_Y,DOE_G,ML_Y,PP_Y", "emp_47|DX센터|안임원|AX6팀|오하윤|G2|ML_Y,DV_GC,PP_B,DOE_G,DA_G,TB_G", "emp_48|DX센터|안임원|AX6팀|임도윤|G2|TB_G,DOE_Y,AU_Y,DA_G", "emp_49|DX센터|안임원|AX6팀|장지아|G2|CL_Y,TB_G,DA_G,DV_Y", "emp_50|DX센터|안임원|AX6팀|한예은|G2|DOE_Y,DV_Y,CL_Y,ML_G", "emp_51|DX센터|안임원|AX6팀|황수빈|G2|DA_Y,PP_SC,ML_SC,PE_SC,DOE_Y,DV_G", "emp_52|DX센터|안임원|AX6팀|강예은|G3|DS_Y,PP_Y,CL_G,AU_Y", "emp_53|DX센터|안임원|AX6팀|김주원|G3|DV_GC,PE_SC,DOE_G,AU_G,CL_GC,DS_SC,TB_Y,PP_B,DA_G,ML_SC", "emp_54|DX센터|안임원|AX6팀|서하준|G3|PE_Y,TB_B,CL_G,DA_Y,DOE_Y,ML_Y", "emp_55|DX센터|안임원|AX6팀|신지우|G3|AU_Y,DV_Y,CL_Y,DA_Y", "emp_56|DX센터|안임원|AX6팀|임민준|G3|DV_G,ML_SC,AU_Y,DOE_Y,PP_B,CL_Y", "emp_57|DX센터|안임원|AX6팀|임민준|G3|PE_G,DV_G,PP_G,DA_Y", "emp_58|DX센터|안임원|AX6팀|최하은|G3|ML_G,DS_Y,DV_Y,CL_G", "emp_59|DX센터|이임원|품질4팀|안서연|G1|PP_Y,CL_G,TB_Y,DOE_G", "emp_60|DX센터|이임원|품질4팀|안서준|G1|DV_G,DA_G,ML_G,AU_G", "emp_61|DX센터|이임원|품질4팀|최도윤|G1|PE_Y,PP_G,DS_Y,AU_Y", "emp_62|DX센터|이임원|품질4팀|홍다은|G1|DA_SC,DV_SC,PE_GC,PP_GC,TB_B,AU_SC,DS_G", "emp_63|DX센터|이임원|품질4팀|강지훈|G2|DA_G,PP_Y,TB_Y,ML_G", "emp_64|DX센터|이임원|품질4팀|권지아|G2|TB_GC,PP_B,DA_GC,ML_G,DV_Y,CL_SC,AU_G,PE_B,DOE_G", "emp_65|DX센터|이임원|품질4팀|김민준|G2|DV_Y,DS_Y,PP_Y,ML_Y", "emp_66|DX센터|이임원|품질4팀|안민서|G2|DOE_Y,CL_GC,PE_Y,PP_G,DV_G,DS_G", "emp_67|DX센터|이임원|품질4팀|정민서|G2|CL_GC,ML_Y,PP_GC,TB_SC,DS_Y,DOE_G", "emp_68|DX센터|이임원|품질4팀|정수아|G2|TB_B,PE_G,PP_GC,DOE_GC,ML_G,DV_G", "emp_69|DX센터|이임원|품질4팀|한지우|G2|CL_B,TB_G,DA_Y,DOE_Y,ML_G,DS_Y", "emp_70|DX센터|이임원|품질4팀|홍수빈|G2|ML_SC,PP_GC,TB_Y,DV_GC,PE_SC,CL_Y,DS_SC,DA_B", "emp_71|DX센터|이임원|품질4팀|안수아|G3|DOE_B,TB_SC,PE_SC,PP_Y,DV_Y,CL_GC", "emp_72|DX센터|이임원|품질4팀|안시우|G3|ML_Y,PP_Y,PE_G,DA_Y", "emp_73|DX센터|이임원|품질4팀|안채원|G3|DV_Y,DA_SC,AU_Y,DOE_SC,PP_G,DS_G", "emp_74|DX센터|이임원|품질4팀|안하윤|G3|AU_GC,TB_G,PP_G,DS_SC,DA_B,DOE_B", "emp_75|DX센터|이임원|품질4팀|윤민준|G3|AU_Y,DA_Y,DV_G,PP_Y", "emp_76|DX센터|이임원|품질4팀|이시우|G3|DOE_SC,PP_SC,TB_G,CL_GC,DA_B,AU_Y", "emp_77|DX센터|이임원|품질4팀|전지호|G3|DV_G,DS_G,PP_Y,DA_G", "emp_78|DX센터|이임원|품질4팀|최예준|G3|DOE_G,TB_Y,CL_Y,DS_Y", "emp_79|DX센터|장임원|회계3팀|김서윤|G1|ML_Y,PP_Y,DOE_G,DV_Y", "emp_80|DX센터|장임원|회계3팀|신민준|G1|PP_Y,DS_Y,CL_Y,DV_G", "emp_81|DX센터|장임원|회계3팀|신하윤|G1|AU_Y,ML_Y,DOE_Y,CL_G", "emp_82|DX센터|장임원|회계3팀|안다은|G1|PE_G,TB_Y,ML_G,DOE_G", "emp_83|DX센터|장임원|회계3팀|임윤서|G1|DOE_B,PP_GC,DA_G,DV_G,TB_GC,DS_Y", "emp_84|DX센터|장임원|회계3팀|한예준|G1|DA_G,DS_G,DOE_Y,CL_Y", "emp_85|DX센터|장임원|회계3팀|한주원|G1|PP_B,TB_Y,DS_B,CL_G,DV_B,AU_G", "emp_86|DX센터|장임원|회계3팀|강서윤|G2|DOE_G,PP_Y,PE_Y,AU_G", "emp_87|DX센터|장임원|회계3팀|권지우|G2|ML_Y,CL_G,DA_GC,DV_G,PE_G,DOE_G", "emp_88|DX센터|장임원|회계3팀|김서연|G2|TB_Y,ML_G,PE_G,DA_G", "emp_89|DX센터|장임원|회계3팀|서서윤|G2|TB_G,DOE_G,PP_G,DV_Y", "emp_90|DX센터|장임원|회계3팀|송서연|G2|DV_GC,CL_Y,DS_SC,DOE_Y,PP_SC,PE_Y", "emp_91|DX센터|장임원|회계3팀|송예준|G2|DOE_Y,PP_G,ML_Y,PE_Y", "emp_92|DX센터|장임원|회계3팀|임윤서|G2|DOE_G,CL_G,PE_Y,DA_Y", "emp_93|DX센터|장임원|회계3팀|조지민|G2|CL_G,TB_G,ML_G,DOE_G", "emp_94|DX센터|장임원|회계3팀|황서윤|G2|ML_SC,DV_G,PE_G,DS_GC,DA_Y,TB_SC", "emp_95|DX센터|장임원|회계3팀|전수빈|G3|TB_G,DA_G,DOE_Y,DV_G", "emp_96|DX센터|장임원|회계3팀|조서현|G3|DS_Y,AU_G,PP_Y,DA_G", "emp_97|DX센터|장임원|회계3팀|한지민|G3|PP_G,CL_G,DV_Y,DOE_Y", "emp_98|DX센터|최임원|기술5팀|강민서|G1|TB_GC,AU_Y,ML_G,DS_Y,DOE_B,DV_Y", "emp_99|DX센터|최임원|기술5팀|권주원|G1|ML_G,DA_G,CL_GC,DOE_B,DS_Y,AU_B", "emp_100|DX센터|최임원|기술5팀|권준우|G1|DA_G,DOE_Y,ML_G,PE_Y", "emp_101|DX센터|최임원|기술5팀|박지호|G1|DS_Y,AU_SC,PP_Y,DV_Y,CL_G,DOE_GC", "emp_102|DX센터|최임원|기술5팀|서하윤|G1|DOE_GC,DA_G,DV_G,PP_G,CL_SC,TB_SC", "emp_103|DX센터|최임원|기술5팀|권지우|G2|DA_GC,ML_B,AU_Y,TB_B,PP_B,CL_G", "emp_104|DX센터|최임원|기술5팀|김도윤|G2|DA_B,CL_G,DOE_GC,DV_GC,ML_B,TB_GC,PP_Y,PE_GC", "emp_105|DX센터|최임원|기술5팀|신서준|G2|DS_SC,DOE_G,PP_B,TB_GC,DA_B,CL_G,AU_G,PE_SC,ML_Y", "emp_106|DX센터|최임원|기술5팀|신하준|G2|DS_G,PP_Y,DA_G,ML_G", "emp_107|DX센터|최임원|기술5팀|윤예은|G2|CL_Y,ML_SC,PE_SC,DS_G,DA_GC,DV_GC,DOE_Y,PP_B,AU_SC", "emp_108|DX센터|최임원|기술5팀|전지민|G2|PE_Y,DV_Y,DA_Y,AU_G", "emp_109|DX센터|최임원|기술5팀|정서연|G2|ML_G,PP_G,DS_Y,CL_G", "emp_110|DX센터|최임원|기술5팀|한지호|G2|PE_Y,PP_Y,DA_G,AU_Y", "emp_111|DX센터|최임원|기술5팀|홍지민|G2|AU_Y,DA_Y,DOE_G,DS_G", "emp_112|DX센터|최임원|기술5팀|김지훈|G3|DS_Y,PE_G,PP_Y,TB_G", "emp_113|DX센터|최임원|기술5팀|송수빈|G3|DV_Y,CL_G,TB_G,AU_Y", "emp_114|DX센터|최임원|기술5팀|안예준|G3|DA_GC,CL_SC,PE_G,ML_SC,PP_SC,AU_G,DOE_G,TB_SC,DS_GC,DV_G", "emp_115|DX센터|최임원|기술5팀|장하윤|G3|PP_G,TB_G,ML_Y,DS_G", "emp_116|DX센터|최임원|기술5팀|한채원|G3|AU_SC,DS_G,CL_Y,TB_SC,DV_B,DOE_G", "emp_117|DX센터|홍임원|AX팀|강지아|G1|DS_Y,ML_G,PE_Y,DA_SC,TB_G,DV_G", "emp_118|DX센터|홍임원|AX팀|신시우|G1|DS_Y,PE_Y,DA_Y,TB_Y", "emp_119|DX센터|홍임원|AX팀|정서연|G1|PP_Y,CL_G,DA_Y,PE_Y", "emp_120|DX센터|홍임원|AX팀|정지유|G1|TB_G,DV_G,PE_Y,DOE_Y", "emp_121|DX센터|홍임원|AX팀|한윤서|G1|ML_G,DOE_Y,TB_Y,PP_Y", "emp_122|DX센터|홍임원|AX팀|한지우|G1|AU_Y,DA_Y,CL_Y,DS_Y", "emp_123|DX센터|홍임원|AX팀|한지훈|G1|DA_Y,PE_Y,DOE_G,CL_Y", "emp_124|DX센터|홍임원|AX팀|홍도윤|G1|ML_G,DOE_G,TB_Y,CL_G", "emp_125|DX센터|홍임원|AX팀|권지유|G2|AU_G,PE_G,DOE_Y,DV_Y", "emp_126|DX센터|홍임원|AX팀|김서연|G2|TB_Y,PP_G,AU_G,DA_G", "emp_127|DX센터|홍임원|AX팀|신예은|G2|AU_Y,PP_G,PE_Y,CL_Y", "emp_128|DX센터|홍임원|AX팀|오도윤|G2|ML_SC,PP_SC,AU_G,DA_Y,TB_SC,PE_GC,DOE_G", "emp_129|DX센터|홍임원|AX팀|장서준|G2|DV_B,PP_B,AU_G,ML_SC,CL_Y,DS_GC,TB_GC", "emp_130|DX센터|홍임원|AX팀|장지민|G2|AU_G,ML_Y,PP_SC,DOE_Y,DV_GC,TB_GC", "emp_131|DX센터|홍임원|AX팀|강다은|G3|DA_G,ML_Y,DS_G,AU_Y", "emp_132|DX센터|홍임원|AX팀|윤서현|G3|AU_Y,DOE_Y,TB_G,DV_G", "emp_133|DX센터|홍임원|AX팀|윤하윤|G3|DA_Y,DV_G,PE_G,TB_G", "emp_134|DX센터|홍임원|AX팀|이하윤|G3|CL_G,DA_G,DS_Y,TB_Y", "emp_135|DX센터|홍임원|AX팀|장예은|G3|TB_Y,PP_Y,CL_Y,DOE_Y", "emp_136|DX센터|홍임원|AX팀|황시우|G3|AU_Y,CL_G,DV_Y,DS_G", "emp_137|ESG경영센터|권임원|구매3팀|권수아|G1|DV_Y,DOE_Y,PP_Y,ML_Y", "emp_138|ESG경영센터|권임원|구매3팀|김시우|G1|AU_Y,DA_Y,DV_G,ML_Y", "emp_139|ESG경영센터|권임원|구매3팀|최하준|G1|DA_Y,DS_G,DV_Y,PP_Y", "emp_140|ESG경영센터|권임원|구매3팀|한지우|G1|AU_G,TB_G,CL_G,DS_G", "emp_141|ESG경영센터|권임원|구매3팀|김민서|G2|DV_Y,PP_Y,DA_Y,CL_G", "emp_142|ESG경영센터|권임원|구매3팀|오서현|G2|DA_G,CL_Y,TB_Y,PP_Y", "emp_143|ESG경영센터|권임원|구매3팀|오수빈|G2|CL_Y,PE_Y,DA_G,DOE_Y", "emp_144|ESG경영센터|권임원|구매3팀|임시우|G2|AU_SC,ML_SC,DS_SC,TB_SC,DV_SC,DOE_Y,CL_GC", "emp_145|ESG경영센터|권임원|구매3팀|임지아|G2|DOE_Y,PP_Y,TB_Y,PE_G", "emp_146|ESG경영센터|권임원|구매3팀|임채원|G2|CL_G,TB_Y,DOE_G,PE_G", "emp_147|ESG경영센터|권임원|구매3팀|전하은|G2|DA_B,PP_SC,AU_Y,TB_GC,ML_Y,DS_SC,CL_GC,DOE_GC,PE_GC,DV_SC", "emp_148|ESG경영센터|권임원|구매3팀|정지훈|G2|PE_G,DS_Y,AU_Y,PP_G", "emp_149|ESG경영센터|권임원|구매3팀|최수빈|G2|CL_Y,PP_Y,DV_Y,DA_G", "emp_150|ESG경영센터|권임원|구매3팀|한예준|G2|DOE_G,TB_Y,DA_G,AU_G", "emp_151|ESG경영센터|권임원|구매3팀|홍예준|G2|DV_B,PE_G,PP_G,CL_G,DA_B,DS_Y", "emp_152|ESG경영센터|권임원|구매3팀|황서현|G2|AU_G,PP_SC,ML_SC,TB_GC,DS_G,CL_G", "emp_153|ESG경영센터|권임원|구매3팀|안윤서|G3|PE_Y,ML_G,TB_Y,DV_Y,CL_G,PP_SC", "emp_154|ESG경영센터|권임원|구매3팀|임지훈|G3|DS_Y,CL_Y,PP_GC,DOE_GC,TB_GC,DV_B", "emp_155|ESG경영센터|권임원|구매3팀|황예은|G3|DV_G,PP_Y,DA_G,DOE_G", "emp_156|ESG경영센터|윤임원|AX7팀|권준우|G1|DS_SC,ML_Y,PP_Y,AU_SC,PE_B,TB_B", "emp_157|ESG경영센터|윤임원|AX7팀|박하윤|G1|TB_Y,ML_Y,AU_Y,DS_G", "emp_158|ESG경영센터|윤임원|AX7팀|이채원|G1|PE_G,TB_G,DV_Y,DOE_G", "emp_159|ESG경영센터|윤임원|AX7팀|장민서|G1|ML_G,PP_Y,PE_SC,DOE_B,DV_G,DS_B", "emp_160|ESG경영센터|윤임원|AX7팀|한다은|G1|DS_G,DOE_Y,AU_G,DV_Y", "emp_161|ESG경영센터|윤임원|AX7팀|권주원|G2|DS_Y,DV_Y,AU_G,PP_Y", "emp_162|ESG경영센터|윤임원|AX7팀|김수빈|G2|PP_G,CL_Y,DS_Y,AU_Y", "emp_163|ESG경영센터|윤임원|AX7팀|서하윤|G2|DOE_Y,DS_Y,PE_SC,AU_Y,ML_GC,DV_GC", "emp_164|ESG경영센터|윤임원|AX7팀|송준우|G2|DA_GC,PP_Y,DOE_B,ML_GC,CL_GC,TB_GC,DS_SC,PE_GC,AU_Y,DV_GC", "emp_165|ESG경영센터|윤임원|AX7팀|신시우|G2|TB_Y,PE_G,AU_Y,DV_G", "emp_166|ESG경영센터|윤임원|AX7팀|장예은|G2|TB_G,PP_Y,CL_Y,DOE_Y", "emp_167|ESG경영센터|윤임원|AX7팀|최민준|G2|DOE_Y,ML_SC,DA_G,CL_G,PE_B,DS_Y", "emp_168|ESG경영센터|윤임원|AX7팀|권민서|G3|CL_G,PE_G,PP_G,DA_Y", "emp_169|ESG경영센터|윤임원|AX7팀|김민서|G3|ML_G,CL_B,PE_G,TB_Y,DOE_Y,DA_B", "emp_170|ESG경영센터|윤임원|AX7팀|김시우|G3|AU_Y,TB_Y,PE_Y,ML_Y", "emp_171|ESG경영센터|윤임원|AX7팀|박예준|G3|ML_G,TB_Y,DOE_Y,PE_Y", "emp_172|ESG경영센터|윤임원|AX7팀|서채원|G3|DA_Y,ML_B,DS_Y,CL_SC,DOE_Y,TB_B,AU_Y,PP_SC,PE_GC,DV_G", "emp_173|ESG경영센터|윤임원|AX7팀|한하준|G3|DA_B,TB_GC,DS_GC,CL_GC,ML_SC,DOE_Y,DV_G,PP_GC", "emp_174|ESG경영센터|윤임원|AX7팀|황채원|G3|DA_SC,DOE_GC,TB_B,ML_Y,DV_G,AU_GC,PP_SC", "emp_175|ESG경영센터|이임원|품질5팀|강예은|G1|PE_Y,DA_G,AU_G,ML_Y", "emp_176|ESG경영센터|이임원|품질5팀|박서윤|G1|DV_B,DOE_SC,DS_GC,TB_GC,DA_SC,CL_Y,ML_G,PP_B,PE_B", "emp_177|ESG경영센터|이임원|품질5팀|윤서현|G1|ML_G,DA_Y,PP_SC,DOE_Y,CL_G,PE_GC", "emp_178|ESG경영센터|이임원|품질5팀|이예은|G1|DA_Y,ML_G,AU_Y,TB_G", "emp_179|ESG경영센터|이임원|품질5팀|장민준|G1|DV_G,DA_G,ML_G,DOE_G", "emp_180|ESG경영센터|이임원|품질5팀|장예은|G1|AU_Y,DS_B,DV_B,CL_SC,ML_G,DA_SC", "emp_181|ESG경영센터|이임원|품질5팀|조다은|G1|TB_G,DS_Y,PE_G,AU_G", "emp_182|ESG경영센터|이임원|품질5팀|최예준|G1|TB_G,DOE_G,ML_Y,PE_Y,AU_Y,DV_G", "emp_183|ESG경영센터|이임원|품질5팀|신예준|G2|DOE_G,DV_G,DA_G,AU_G", "emp_184|ESG경영센터|이임원|품질5팀|최채원|G2|AU_G,ML_G,TB_Y,CL_Y", "emp_185|ESG경영센터|이임원|품질5팀|황채원|G2|CL_G,DS_G,DA_GC,DV_SC,AU_Y,TB_B", "emp_186|ESG경영센터|이임원|품질5팀|황하윤|G2|DS_Y,TB_G,AU_Y,ML_Y", "emp_187|ESG경영센터|이임원|품질5팀|황하은|G2|TB_Y,PP_G,DOE_G,PE_G", "emp_188|ESG경영센터|이임원|품질5팀|강민준|G3|DV_Y,DA_G,CL_Y,ML_Y", "emp_189|ESG경영센터|이임원|품질5팀|송시우|G3|TB_G,DOE_Y,DA_Y,ML_Y", "emp_190|ESG경영센터|이임원|품질5팀|안민서|G3|DA_SC,AU_Y,ML_GC,CL_B,PE_SC,DV_G", "emp_191|ESG경영센터|이임원|품질5팀|장민준|G3|PE_Y,CL_G,PP_Y,DA_G", "emp_192|ESG경영센터|이임원|품질5팀|조민서|G3|DV_G,AU_Y,PE_G,DOE_Y", "emp_193|ESG경영센터|이임원|품질5팀|조채원|G3|DA_Y,DS_Y,DOE_Y,PP_Y", "emp_194|ESG경영센터|이임원|품질5팀|홍예은|G3|TB_SC,ML_SC,DV_G,PE_Y,DS_Y,CL_G", "emp_195|ESG경영센터|전임원|AX5팀|강서현|G1|PE_Y,TB_G,ML_G,AU_G", "emp_196|ESG경영센터|전임원|AX5팀|오지호|G1|DV_Y,DS_Y,TB_G,DOE_Y", "emp_197|ESG경영센터|전임원|AX5팀|윤준우|G1|AU_Y,PP_G,PE_Y,TB_Y", "emp_198|ESG경영센터|전임원|AX5팀|이지우|G1|DOE_Y,DV_Y,TB_Y,PE_G", "emp_199|ESG경영센터|전임원|AX5팀|조지유|G1|DOE_G,CL_Y,PE_G,PP_GC,DV_G,ML_G", "emp_200|ESG경영센터|전임원|AX5팀|최시우|G1|DA_Y,PP_G,CL_Y,AU_G", "emp_201|ESG경영센터|전임원|AX5팀|송채원|G2|PP_G,CL_G,AU_Y,DS_Y", "emp_202|ESG경영센터|전임원|AX5팀|정민준|G2|DOE_G,DS_Y,DV_Y,DA_G", "emp_203|ESG경영센터|전임원|AX5팀|박지유|G3|PP_G,TB_G,AU_Y,DOE_GC,ML_Y,DA_GC", "emp_204|ESG경영센터|전임원|AX5팀|윤민준|G3|DA_G,DV_SC,AU_B,DS_G,TB_SC,PP_Y", "emp_205|ESG경영센터|전임원|AX5팀|전서준|G3|CL_Y,TB_B,PP_G,PE_B,DV_GC,ML_G", "emp_206|ESG경영센터|전임원|AX5팀|조서연|G3|AU_Y,CL_G,DS_G,PP_B,PE_G,DOE_G", "emp_207|ESG경영센터|전임원|AX5팀|한서준|G3|DV_Y,CL_Y,AU_Y,TB_Y", "emp_208|ESG경영센터|최임원|사업4팀|이하윤|G1|PE_GC,AU_G,CL_B,TB_SC,ML_GC,DOE_Y", "emp_209|ESG경영센터|최임원|사업4팀|임서현|G1|TB_G,PE_G,DS_B,DA_Y,DOE_B,ML_G", "emp_210|ESG경영센터|최임원|사업4팀|장도윤|G1|DA_GC,PE_Y,DV_B,TB_B,ML_B,DS_B,AU_SC,PP_GC,CL_SC,DOE_SC", "emp_211|ESG경영센터|최임원|사업4팀|전지훈|G1|ML_Y,DS_Y,PP_G,DA_Y", "emp_212|ESG경영센터|최임원|사업4팀|최수빈|G1|DA_Y,CL_Y,AU_G,TB_Y", "emp_213|ESG경영센터|최임원|사업4팀|김민준|G2|PP_Y,DA_Y,CL_Y,DS_Y", "emp_214|ESG경영센터|최임원|사업4팀|김예준|G2|DOE_GC,PE_SC,DV_Y,PP_Y,AU_G,CL_Y", "emp_215|ESG경영센터|최임원|사업4팀|이채원|G2|DS_Y,PE_SC,AU_Y,DV_B,DA_SC,DOE_Y", "emp_216|ESG경영센터|최임원|사업4팀|조지우|G2|CL_SC,PP_G,PE_SC,AU_GC,DA_Y,DV_Y", "emp_217|ESG경영센터|최임원|사업4팀|홍지훈|G2|DS_Y,AU_Y,PP_Y,DA_Y", "emp_218|ESG경영센터|최임원|사업4팀|권예준|G3|DOE_Y,AU_Y,DV_Y,PP_Y", "emp_219|ESG경영센터|최임원|사업4팀|박시우|G3|ML_Y,DV_Y,DA_Y,PP_G", "emp_220|ESG경영센터|최임원|사업4팀|박시우|G3|AU_Y,DV_Y,PE_G,DS_Y", "emp_221|ESG경영센터|최임원|사업4팀|서서윤|G3|CL_GC,AU_G,PP_G,PE_SC,TB_GC,DV_B,DA_GC", "emp_222|ESG경영센터|최임원|사업4팀|안민서|G3|DS_Y,AU_Y,DOE_Y,DA_Y", "emp_223|ESG경영센터|최임원|사업4팀|안민준|G3|PP_G,DA_G,TB_G,CL_G", "emp_224|ESG경영센터|최임원|사업4팀|윤수빈|G3|ML_Y,TB_G,PP_Y,PE_G", "emp_225|ESG경영센터|최임원|사업4팀|조수아|G3|ML_Y,DV_G,DOE_G,TB_Y", "emp_226|ESG경영센터|최임원|사업4팀|조윤서|G3|PE_G,CL_Y,DOE_Y,AU_Y", "emp_227|ESG경영센터|최임원|사업4팀|홍서윤|G3|AU_Y,DS_Y,DV_Y,TB_G", "emp_228|ESG경영센터|한임원|연구2팀|권서현|G1|CL_B,PP_B,DS_SC,AU_GC,DV_SC,DA_GC,DOE_B,PE_G", "emp_229|ESG경영센터|한임원|연구2팀|윤도윤|G1|CL_G,DV_Y,PE_G,DOE_G", "emp_230|ESG경영센터|한임원|연구2팀|조지유|G1|PP_Y,CL_Y,DV_Y,TB_G", "emp_231|ESG경영센터|한임원|연구2팀|홍민준|G1|PE_G,CL_Y,DOE_G,AU_Y", "emp_232|ESG경영센터|한임원|연구2팀|홍하준|G1|DOE_G,PP_Y,DS_Y,PE_Y", "emp_233|ESG경영센터|한임원|연구2팀|권윤서|G2|DV_G,ML_SC,TB_Y,PE_Y,CL_SC,AU_SC,DA_SC,DS_GC,PP_GC", "emp_234|ESG경영센터|한임원|연구2팀|김서윤|G2|CL_GC,DA_Y,AU_G,DV_G,PP_G,DS_G,ML_G,TB_SC,PE_SC,DOE_Y", "emp_235|ESG경영센터|한임원|연구2팀|송민서|G2|AU_Y,DS_G,PE_Y,PP_Y", "emp_236|ESG경영센터|한임원|연구2팀|윤지호|G2|AU_G,ML_Y,DOE_G,PE_G", "emp_237|ESG경영센터|한임원|연구2팀|임민서|G2|DOE_Y,CL_SC,TB_Y,DS_G,AU_Y,DA_GC", "emp_238|ESG경영센터|한임원|연구2팀|장지우|G2|PE_Y,AU_Y,TB_G,DOE_Y", "emp_239|ESG경영센터|한임원|연구2팀|정서윤|G2|ML_G,PP_G,AU_Y,DS_Y", "emp_240|ESG경영센터|한임원|연구2팀|정윤서|G2|DV_B,DS_G,DA_GC,AU_SC,CL_Y,DOE_Y", "emp_241|ESG경영센터|한임원|연구2팀|강지유|G3|DV_Y,DA_Y,DOE_G,PP_Y", "emp_242|ESG경영센터|한임원|연구2팀|권지민|G3|CL_Y,DV_G,DS_GC,AU_SC,DA_Y,PP_SC", "emp_243|ESG경영센터|한임원|연구2팀|김하윤|G3|PP_G,PE_Y,ML_Y,DS_Y", "emp_244|ESG경영센터|한임원|연구2팀|장서현|G3|ML_SC,PP_B,DOE_B,CL_Y,DS_Y,AU_Y", "emp_245|ESG경영센터|한임원|연구2팀|최지유|G3|PP_Y,DS_G,CL_Y,DV_G", "emp_246|ESG경영센터|한임원|연구2팀|한도윤|G3|ML_G,PP_SC,AU_SC,DS_Y,DA_G,TB_Y,DV_GC", "emp_247|ESG경영센터|한임원|연구2팀|황서윤|G3|DA_B,PP_GC,DOE_SC,TB_Y,DV_Y,PE_GC", "emp_248|R&D센터|강임원|전략3팀|강하준|G1|TB_G,DS_Y,PP_Y,CL_Y", "emp_249|R&D센터|강임원|전략3팀|서지우|G1|CL_G,DV_G,DA_G,ML_Y", "emp_250|R&D센터|강임원|전략3팀|조하준|G1|PE_G,CL_Y,DS_Y,PP_G", "emp_251|R&D센터|강임원|전략3팀|한서현|G1|DV_G,PE_SC,DS_Y,AU_Y,DOE_G,PP_SC", "emp_252|R&D센터|강임원|전략3팀|강시우|G2|CL_G,PE_Y,DS_Y,DA_Y", "emp_253|R&D센터|강임원|전략3팀|송서윤|G2|DV_Y,AU_Y,TB_G,ML_Y", "emp_254|R&D센터|강임원|전략3팀|임다은|G2|DA_Y,PE_Y,ML_Y,PP_G", "emp_255|R&D센터|강임원|전략3팀|임채원|G2|TB_G,DS_Y,AU_Y,DOE_G", "emp_256|R&D센터|강임원|전략3팀|전서연|G2|ML_SC,DS_SC,DV_G,CL_GC,AU_B,DA_GC,TB_B,PP_GC,PE_GC,DOE_G", "emp_257|R&D센터|강임원|전략3팀|전서현|G2|AU_G,ML_Y,PP_G,CL_G", "emp_258|R&D센터|강임원|전략3팀|전준우|G2|DA_Y,DV_Y,DS_G,TB_Y", "emp_259|R&D센터|강임원|전략3팀|정지민|G2|PP_Y,AU_Y,PE_Y,DV_Y", "emp_260|R&D센터|강임원|전략3팀|최예준|G2|DA_Y,DV_G,PP_Y,DOE_Y", "emp_261|R&D센터|강임원|전략3팀|한수빈|G2|DV_Y,ML_Y,DOE_Y,AU_Y", "emp_262|R&D센터|강임원|전략3팀|한주원|G2|AU_Y,DV_SC,DOE_G,TB_GC,ML_Y,CL_Y", "emp_263|R&D센터|강임원|전략3팀|권서준|G3|PP_G,PE_Y,TB_G,AU_Y", "emp_264|R&D센터|강임원|전략3팀|김수아|G3|PE_Y,DOE_G,CL_Y,DV_Y", "emp_265|R&D센터|강임원|전략3팀|송민준|G3|TB_G,DV_G,DS_Y,ML_Y", "emp_266|R&D센터|강임원|전략3팀|이서준|G3|TB_GC,DS_Y,DOE_SC,ML_Y,AU_SC,PE_GC", "emp_267|R&D센터|강임원|전략3팀|최수빈|G3|PE_Y,ML_G,PP_G,DS_Y", "emp_268|R&D센터|서임원|지원3팀|박지민|G1|TB_G,DV_Y,DS_Y,ML_G", "emp_269|R&D센터|서임원|지원3팀|조하준|G1|ML_G,DS_G,TB_G,PE_G,DA_Y,DV_G", "emp_270|R&D센터|서임원|지원3팀|강도윤|G2|TB_SC,PP_SC,PE_GC,ML_G,DS_GC,DV_Y,CL_Y,DA_GC,AU_G", "emp_271|R&D센터|서임원|지원3팀|박시우|G2|CL_Y,PP_G,DOE_G,AU_G", "emp_272|R&D센터|서임원|지원3팀|신하윤|G2|PP_Y,DS_Y,ML_Y,TB_Y", "emp_273|R&D센터|서임원|지원3팀|윤수아|G2|TB_Y,ML_Y,DS_G,PP_Y", "emp_274|R&D센터|서임원|지원3팀|이서연|G2|DV_B,DA_SC,PP_Y,ML_G,CL_B,DOE_Y", "emp_275|R&D센터|서임원|지원3팀|임예준|G2|DOE_GC,PE_B,TB_Y,ML_SC,PP_SC,DA_G", "emp_276|R&D센터|서임원|지원3팀|전지우|G2|DA_Y,DS_Y,TB_Y,ML_G", "emp_277|R&D센터|서임원|지원3팀|최준우|G2|CL_G,ML_SC,DA_GC,DS_Y,DOE_SC,TB_GC,AU_GC,DV_Y", "emp_278|R&D센터|서임원|지원3팀|한지호|G2|DV_Y,CL_Y,DOE_G,PE_G", "emp_279|R&D센터|서임원|지원3팀|황민준|G2|DV_G,TB_G,DA_Y,AU_Y", "emp_280|R&D센터|서임원|지원3팀|황지아|G2|DOE_Y,ML_Y,PP_Y,DA_Y", "emp_281|R&D센터|서임원|지원3팀|김주원|G3|ML_G,DOE_Y,TB_Y,DV_G", "emp_282|R&D센터|서임원|지원3팀|박하준|G3|CL_Y,DV_G,PE_Y,TB_Y", "emp_283|R&D센터|서임원|지원3팀|안다은|G3|PE_GC,PP_Y,DA_B,DS_SC,CL_Y,DOE_G", "emp_284|R&D센터|서임원|지원3팀|오지훈|G3|CL_GC,TB_Y,PP_Y,DV_GC,PE_GC,AU_GC,DA_SC,DS_SC", "emp_285|R&D센터|서임원|지원3팀|임채원|G3|TB_B,DOE_GC,PE_SC,DS_G,PP_GC,AU_Y", "emp_286|R&D센터|서임원|지원3팀|전서준|G3|ML_B,TB_G,DS_G,PP_GC,DV_B,AU_Y", "emp_287|R&D센터|서임원|지원3팀|황지훈|G3|AU_G,ML_Y,TB_G,DS_Y", "emp_288|R&D센터|안임원|전략5팀|서지호|G1|ML_Y,DA_G,DV_G,PE_Y", "emp_289|R&D센터|안임원|전략5팀|장준우|G1|DA_Y,AU_Y,PE_G,PP_G", "emp_290|R&D센터|안임원|전략5팀|최지우|G1|DOE_G,PP_Y,CL_Y,DS_Y", "emp_291|R&D센터|안임원|전략5팀|황채원|G1|TB_G,AU_Y,CL_G,PE_Y", "emp_292|R&D센터|안임원|전략5팀|권지호|G2|AU_G,PE_G,DS_Y,DA_Y", "emp_293|R&D센터|안임원|전략5팀|송예은|G2|TB_B,DV_SC,CL_B,DA_Y,ML_G,PE_SC,PP_Y,DS_Y,DOE_SC", "emp_294|R&D센터|안임원|전략5팀|송지민|G2|ML_Y,AU_G,TB_G,DOE_G", "emp_295|R&D센터|안임원|전략5팀|오지아|G2|DV_Y,TB_SC,DA_Y,DS_GC,ML_Y,DOE_B", "emp_296|R&D센터|안임원|전략5팀|윤하은|G2|CL_Y,AU_Y,DOE_Y,DV_Y", "emp_297|R&D센터|안임원|전략5팀|이채원|G2|AU_G,DA_Y,DOE_Y,CL_G", "emp_298|R&D센터|안임원|전략5팀|정서연|G2|ML_GC,TB_B,DOE_B,DS_SC,DA_SC,PE_SC,PP_G,AU_SC", "emp_299|R&D센터|안임원|전략5팀|한지민|G2|ML_G,PP_G,TB_Y,DV_Y", "emp_300|R&D센터|안임원|전략5팀|강하은|G3|DS_Y,PP_Y,DOE_G,TB_Y", "emp_301|R&D센터|안임원|전략5팀|윤하은|G3|DV_Y,CL_Y,PP_Y,DA_G", "emp_302|R&D센터|안임원|전략5팀|홍하준|G3|DS_Y,PP_Y,CL_Y,PE_Y", "emp_303|R&D센터|안임원|전략5팀|황민서|G3|PP_Y,DV_G,TB_GC,ML_Y,CL_B,DOE_GC", "emp_304|R&D센터|이임원|관리6팀|신수빈|G1|ML_G,DS_G,AU_Y,DOE_Y", "emp_305|R&D센터|이임원|관리6팀|윤하윤|G1|AU_GC,DV_Y,PE_B,ML_SC,TB_SC,DOE_B,PP_SC", "emp_306|R&D센터|이임원|관리6팀|조지아|G1|AU_Y,ML_Y,TB_G,PE_Y", "emp_307|R&D센터|이임원|관리6팀|홍서윤|G1|PP_G,DOE_Y,AU_Y,PE_G", "emp_308|R&D센터|이임원|관리6팀|홍서준|G1|CL_Y,PE_G,AU_Y,DS_Y", "emp_309|R&D센터|이임원|관리6팀|강수아|G2|ML_Y,DOE_Y,PP_Y,CL_Y", "emp_310|R&D센터|이임원|관리6팀|권지우|G2|DA_GC,DS_GC,TB_GC,PE_GC,DOE_G,DV_G,ML_G,AU_GC", "emp_311|R&D센터|이임원|관리6팀|윤서현|G2|ML_Y,AU_B,PE_B,CL_GC,DV_G,PP_GC", "emp_312|R&D센터|이임원|관리6팀|임다은|G2|ML_G,CL_Y,TB_Y,PE_Y", "emp_313|R&D센터|이임원|관리6팀|전지호|G2|PP_G,DV_G,CL_Y,ML_Y", "emp_314|R&D센터|이임원|관리6팀|홍윤서|G2|PE_Y,PP_GC,DA_SC,DOE_G,TB_SC,AU_GC,DV_GC", "emp_315|R&D센터|이임원|관리6팀|황도윤|G2|DV_Y,PE_G,ML_Y,PP_Y", "emp_316|R&D센터|이임원|관리6팀|박민준|G3|DA_G,DOE_SC,DS_Y,CL_B,PP_G,AU_Y", "emp_317|R&D센터|이임원|관리6팀|신도윤|G3|DV_SC,PP_B,AU_G,DOE_Y,DA_B,TB_Y", "emp_318|R&D센터|이임원|관리6팀|신준우|G3|PP_B,DS_B,ML_G,AU_SC,TB_Y,PE_Y", "emp_319|R&D센터|이임원|관리6팀|장서연|G3|PE_G,DV_Y,ML_Y,CL_Y", "emp_320|R&D센터|이임원|관리6팀|정다은|G3|PE_B,DOE_B,TB_Y,ML_G,DS_Y,AU_G", "emp_321|R&D센터|이임원|관리6팀|조서윤|G3|AU_G,DV_SC,DS_SC,TB_Y,PP_SC,CL_G", "emp_322|R&D센터|이임원|관리6팀|조서준|G3|DS_G,AU_Y,DA_G,DV_G", "emp_323|R&D센터|이임원|관리6팀|한서연|G3|DS_Y,AU_Y,ML_G,PP_G", "emp_324|R&D센터|장임원|회계6팀|송서현|G1|DV_G,DS_Y,TB_Y,ML_G", "emp_325|R&D센터|장임원|회계6팀|송지우|G1|PP_G,CL_Y,PE_G,TB_Y", "emp_326|R&D센터|장임원|회계6팀|신서윤|G1|TB_Y,DOE_Y,CL_Y,PP_Y", "emp_327|R&D센터|장임원|회계6팀|안윤서|G1|DS_GC,DV_B,CL_Y,PE_G,PP_G,DOE_G", "emp_328|R&D센터|장임원|회계6팀|임민서|G1|DA_G,TB_Y,CL_Y,ML_Y", "emp_329|R&D센터|장임원|회계6팀|홍지훈|G1|PE_G,DA_Y,DV_Y,DOE_G", "emp_330|R&D센터|장임원|회계6팀|신채원|G2|DOE_Y,PE_G,AU_Y,DV_Y", "emp_331|R&D센터|장임원|회계6팀|안민준|G2|PP_Y,ML_G,DV_GC,TB_GC,DS_G,DA_SC,PE_SC", "emp_332|R&D센터|장임원|회계6팀|오주원|G2|PE_G,PP_G,DS_Y,CL_Y", "emp_333|R&D센터|장임원|회계6팀|윤하은|G2|DV_GC,AU_Y,CL_Y,TB_Y,DA_G,ML_G", "emp_334|R&D센터|장임원|회계6팀|황윤서|G2|ML_G,PP_Y,DS_G,PE_Y", "emp_335|R&D센터|장임원|회계6팀|권준우|G3|DV_Y,DS_Y,CL_G,PE_Y", "emp_336|R&D센터|장임원|회계6팀|김지호|G3|DA_Y,PE_Y,CL_Y,ML_G", "emp_337|R&D센터|장임원|회계6팀|신지호|G3|ML_Y,PP_GC,DOE_G,DA_Y,TB_Y,CL_SC", "emp_338|R&D센터|장임원|회계팀|이서연|G3|ML_B,AU_GC,DS_B,TB_G,PP_Y,DA_B", "emp_339|R&D센터|장임원|회계6팀|임수빈|G3|TB_G,AU_Y,DA_Y,DV_Y", "emp_340|R&D센터|장임원|회계6팀|조예준|G3|PE_G,CL_Y,DOE_B,PP_Y,TB_Y,ML_G", "emp_341|R&D센터|장임원|회계6팀|최지민|G3|CL_B,ML_SC,DA_SC,DS_G,PP_Y,DOE_G", "emp_342|R&D센터|장임원|회계6팀|한하윤|G3|TB_G,DV_Y,PP_Y,DOE_Y", "emp_343|R&D센터|최임원|AX3팀|강예은|G1|DOE_G,DV_G,TB_G,DA_G", "emp_344|R&D센터|최임원|AX3팀|박예준|G1|DA_G,PE_G,AU_Y,TB_G", "emp_345|R&D센터|최임원|AX3팀|안예은|G1|TB_GC,PP_GC,PE_Y,DOE_GC,CL_SC,DV_G", "emp_346|R&D센터|최임원|AX3팀|장하윤|G1|AU_G,PP_Y,CL_Y,PE_Y", "emp_347|R&D센터|최임원|AX3팀|조수아|G1|PE_Y,DOE_B,PP_B,DA_GC,TB_GC,DV_SC,AU_G,DS_Y", "emp_348|R&D센터|최임원|AX3팀|한채원|G1|DA_Y,TB_G,ML_G,PP_Y", "emp_349|R&D센터|최임원|AX3팀|강지우|G2|TB_Y,DOE_G,DS_G,PP_Y", "emp_350|R&D센터|최임원|AX3팀|권서연|G2|PP_Y,DS_Y,DA_Y,CL_Y", "emp_351|R&D센터|최임원|AX3팀|송민서|G2|PP_G,DOE_G,PE_Y,TB_Y", "emp_352|R&D센터|최임원|AX3팀|송서현|G2|AU_Y,DS_Y,DV_G,TB_Y", "emp_353|R&D센터|최임원|AX3팀|오지호|G2|DA_Y,DS_Y,ML_G,CL_Y", "emp_354|R&D센터|최임원|AX3팀|임수빈|G2|PE_Y,AU_Y,PP_Y,DS_Y", "emp_355|R&D센터|최임원|AX3팀|장민준|G2|DA_Y,ML_Y,PE_GC,AU_G,DOE_G,PP_G", "emp_356|R&D센터|최임원|AX3팀|장지유|G2|CL_Y,PE_G,DV_Y,PP_Y", "emp_357|R&D센터|최임원|AX3팀|조주원|G2|AU_Y,DA_G,DOE_Y,ML_Y", "emp_358|R&D센터|최임원|AX3팀|황시우|G2|PE_GC,PP_Y,DS_G,ML_G,DV_B,AU_B", "emp_359|R&D센터|최임원|AX3팀|신채원|G3|DOE_G,CL_G,PP_SC,PE_Y,ML_SC,DS_SC", "emp_360|R&D센터|최임원|AX3팀|오준우|G3|AU_Y,TB_Y,PP_Y,DA_G", "emp_361|R&D센터|최임원|AX3팀|이수아|G3|CL_SC,PE_B,ML_SC,DOE_G,PP_Y,DS_G", "emp_362|R&D센터|최임원|AX3팀|한서연|G3|TB_G,CL_GC,ML_Y,PE_GC,DOE_Y,DA_Y", "emp_363|R&D센터|홍임원|전략4팀|안지호|G1|DA_G,DS_Y,PP_G,TB_Y", "emp_364|R&D센터|홍임원|전략4팀|조채원|G1|DS_SC,CL_G,DOE_SC,PE_Y,PP_GC,TB_SC", "emp_365|R&D센터|홍임원|전략4팀|권지호|G2|DV_B,DOE_B,ML_Y,DS_Y,PP_GC,CL_GC", "emp_366|R&D센터|홍임원|전략4팀|송주원|G2|PP_Y,TB_G,ML_Y,DS_G", "emp_367|R&D센터|홍임원|전략4팀|신예준|G2|AU_G,TB_G,CL_B,DOE_Y,PE_SC,DS_SC", "emp_368|R&D센터|홍임원|전략4팀|윤서현|G2|PP_G,PE_Y,ML_Y,DA_Y", "emp_369|R&D센터|홍임원|전략4팀|전서연|G2|TB_G,DOE_G,ML_Y,DV_Y", "emp_370|R&D센터|홍임원|전략4팀|황도윤|G2|DA_Y,AU_B,DV_Y,TB_GC,CL_G,PE_G", "emp_371|R&D센터|홍임원|전략4팀|황하은|G2|PP_Y,PE_Y,CL_Y,DA_Y", "emp_372|R&D센터|홍임원|전략4팀|김예준|G3|DS_G,TB_G,CL_B,AU_B,DA_GC,DOE_G", "emp_373|R&D센터|홍임원|전략4팀|이예은|G3|PP_G,DOE_G,AU_G,CL_G", "emp_374|R&D센터|홍임원|전략4팀|임지우|G3|DS_G,CL_Y,DOE_Y,TB_G", "emp_375|R&D센터|홍임원|전략4팀|전지유|G3|AU_G,DOE_G,PP_G,ML_G", "emp_376|R&D센터|홍임원|전략4팀|조채원|G3|DOE_G,PE_Y,ML_Y,DV_Y", "emp_377|R&D센터|홍임원|전략4팀|황윤서|G3|DS_Y,PE_Y,DOE_Y,DA_G", "emp_378|글로벌전략센터|권임원|관리3팀|권준우|G1|TB_Y,AU_G,ML_Y,DS_Y", "emp_379|글로벌전략센터|권임원|관리3팀|박서준|G1|AU_Y,DS_Y,DA_G,PE_G", "emp_380|글로벌전략센터|권임원|관리3팀|서다은|G1|TB_SC,PP_Y,DOE_Y,PE_Y,DA_B,DV_Y", "emp_381|글로벌전략센터|권임원|관리3팀|서서준|G1|DOE_B,DA_GC,TB_GC,AU_Y,PP_SC,CL_SC,ML_B,DV_SC", "emp_382|글로벌전략센터|권임원|관리3팀|오지우|G1|DS_Y,AU_Y,PE_Y,DV_Y", "emp_383|글로벌전략센터|권임원|관리3팀|조주원|G1|DA_G,DS_SC,AU_B,ML_GC,CL_GC,DV_G,TB_G,PP_B", "emp_384|글로벌전략센터|권임원|관리3팀|한지유|G1|AU_Y,PP_G,DA_B,PE_B,DV_G,TB_Y", "emp_385|글로벌전략센터|권임원|관리3팀|홍주원|G1|PP_G,DV_Y,AU_Y,PE_Y", "emp_386|글로벌전략센터|권임원|관리3팀|송예준|G2|AU_Y,CL_Y,DOE_G,TB_G", "emp_387|글로벌전략센터|권임원|관리3팀|오준우|G2|AU_Y,DS_G,DOE_G,DA_Y", "emp_388|글로벌전략센터|권임원|관리3팀|윤민서|G2|ML_G,TB_G,DV_SC,AU_Y,DOE_GC,DA_B", "emp_389|글로벌전략센터|권임원|관리3팀|윤서연|G2|DOE_Y,DV_Y,AU_G,PE_G", "emp_390|글로벌전략센터|권임원|관리3팀|윤예은|G2|ML_Y,CL_Y,DA_G,DS_Y", "emp_391|글로벌전략센터|권임원|관리3팀|황하윤|G2|DOE_G,PP_G,DA_G,ML_Y", "emp_392|글로벌전략센터|권임원|관리3팀|강하은|G3|PP_Y,DS_Y,DV_G,TB_G", "emp_393|글로벌전략센터|권임원|관리3팀|윤지우|G3|PP_Y,PE_Y,TB_G,AU_Y", "emp_394|글로벌전략센터|김임원|혁신2팀|안민서|G1|ML_B,PE_B,PP_SC,TB_B,DA_Y,AU_B,DV_SC,DS_Y,DOE_GC", "emp_395|글로벌전략센터|김임원|혁신2팀|안시우|G1|ML_SC,PE_GC,DA_G,DS_Y,TB_GC,PP_Y,DOE_SC", "emp_396|글로벌전략센터|김임원|혁신2팀|전다은|G1|CL_Y,AU_Y,DS_Y,TB_Y", "emp_397|글로벌전략센터|김임원|혁신2팀|김서준|G2|DS_G,PP_Y,DOE_GC,ML_Y,CL_G,TB_Y", "emp_398|글로벌전략센터|김임원|혁신2팀|박지아|G2|DA_Y,DS_G,PE_Y,TB_Y", "emp_399|글로벌전략센터|김임원|혁신2팀|장도윤|G2|AU_Y,ML_G,PP_Y,CL_Y", "emp_400|글로벌전략센터|김임원|혁신2팀|전지호|G2|PE_SC,DV_B,DOE_SC,AU_GC,PP_G,DA_GC,TB_SC,CL_SC,ML_G", "emp_401|글로벌전략센터|김임원|혁신2팀|전하준|G2|DS_G,ML_Y,CL_Y,TB_Y", "emp_402|글로벌전략센터|김임원|혁신2팀|한시우|G2|DS_Y,AU_Y,DV_Y,PP_Y", "emp_403|글로벌전략센터|김임원|혁신2팀|홍지유|G2|DS_Y,DA_Y,PP_Y,TB_Y", "emp_404|글로벌전략센터|김임원|혁신2팀|권서윤|G3|ML_Y,TB_G,PP_Y,DS_G", "emp_405|글로벌전략센터|김임원|혁신2팀|신하준|G3|TB_G,DA_G,CL_G,PE_Y", "emp_406|글로벌전략센터|김임원|혁신2팀|오서현|G3|PP_Y,DA_Y,PE_G,DOE_Y", "emp_407|글로벌전략센터|김임원|혁신2팀|오윤서|G3|PE_G,CL_Y,ML_Y,PP_Y", "emp_408|글로벌전략센터|김임원|혁신2팀|윤서준|G3|PE_Y,DA_G,DV_G,CL_G", "emp_409|글로벌전략센터|김임원|혁신2팀|임서준|G3|DOE_Y,AU_SC,DA_G,DV_G,DS_G,CL_SC", "emp_410|글로벌전략센터|김임원|혁신2팀|장도윤|G3|DOE_Y,DV_G,TB_G,PE_G", "emp_411|글로벌전략센터|김임원|혁신2팀|한준우|G3|DOE_Y,DV_GC,PE_G,CL_SC,ML_Y,PP_G", "emp_412|글로벌전략센터|박임원|전략6팀|안민준|G1|PP_Y,DV_G,DA_Y,AU_Y", "emp_413|글로벌전략센터|박임원|전략6팀|전주원|G1|DS_G,CL_GC,PE_GC,DA_GC,DOE_B,ML_GC", "emp_414|글로벌전략센터|박임원|전략6팀|조시우|G1|ML_Y,AU_G,DOE_Y,TB_Y,PE_Y,DA_B", "emp_415|글로벌전략센터|박임원|전략6팀|최지유|G1|AU_Y,DOE_G,ML_G,PE_Y", "emp_416|글로벌전략센터|박임원|전략6팀|한주원|G1|TB_SC,ML_SC,DOE_SC,CL_GC,PE_Y,DS_G", "emp_417|글로벌전략센터|박임원|전략6팀|황예은|G1|TB_Y,AU_G,CL_G,PP_G,DOE_Y,ML_G", "emp_418|글로벌전략센터|박임원|전략6팀|서서윤|G2|ML_SC,PP_Y,CL_G,AU_G,DA_GC,DOE_GC,PE_SC", "emp_419|글로벌전략센터|박임원|전략6팀|서지우|G2|PE_Y,DS_Y,ML_Y,DOE_Y,DA_G,PP_G", "emp_420|글로벌전략센터|박임원|전략6팀|송지훈|G2|TB_GC,ML_GC,PP_Y,CL_Y,DOE_Y,DS_SC", "emp_421|글로벌전략센터|박임원|전략6팀|신다은|G2|PE_Y,DV_Y,PP_Y,DA_Y", "emp_422|글로벌전략센터|박임원|전략6팀|최민서|G2|PP_B,ML_G,TB_GC,DA_B,DS_SC,CL_GC,AU_B,DOE_B,DV_GC", "emp_423|글로벌전략센터|박임원|전략6팀|최지호|G2|DV_Y,CL_Y,AU_B,ML_SC,TB_G,PE_GC", "emp_424|글로벌전략센터|박임원|전략6팀|홍수빈|G2|DOE_G,DV_Y,PE_Y,DS_Y", "emp_425|글로벌전략센터|박임원|전략6팀|강지호|G3|DA_Y,TB_G,DS_Y,AU_G", "emp_426|글로벌전략센터|박임원|전략6팀|정지우|G3|DS_Y,DV_G,PE_Y,AU_Y", "emp_427|글로벌전략센터|박임원|전략6팀|최수아|G3|ML_Y,TB_Y,DA_G,AU_Y", "emp_428|글로벌전략센터|송임원|지원2팀|송서준|G1|DS_G,PE_Y,DV_G,CL_GC,PP_B,DOE_SC", "emp_429|글로벌전략센터|송임원|지원2팀|장수아|G1|CL_G,ML_Y,PE_Y,DV_Y", "emp_430|글로벌전략센터|송임원|지원2팀|최서연|G1|DS_GC,PE_G,DV_GC,DA_B,CL_SC,AU_Y", "emp_431|글로벌전략센터|송임원|지원2팀|최예은|G1|ML_Y,TB_G,AU_Y,DOE_GC,DS_B,PP_GC,CL_SC,DA_GC,DV_GC,PE_G", "emp_432|글로벌전략센터|송임원|지원2팀|한준우|G1|DA_Y,PP_G,DOE_G,PE_G", "emp_433|글로벌전략센터|송임원|지원2팀|홍서연|G1|PE_Y,TB_Y,AU_Y,ML_Y", "emp_434|글로벌전략센터|송임원|지원2팀|강수아|G2|AU_Y,DA_Y,DOE_Y,PE_G", "emp_435|글로벌전략센터|송임원|지원2팀|안지유|G2|DA_G,DV_G,TB_Y,DOE_G", "emp_436|글로벌전략센터|송임원|지원2팀|오지아|G2|DOE_Y,AU_Y,TB_G,PP_G", "emp_437|글로벌전략센터|송임원|지원2팀|윤민서|G2|DA_Y,AU_G,PP_G,PE_Y", "emp_438|글로벌전략센터|송임원|지원2팀|조수아|G2|AU_Y,DA_Y,PE_Y,CL_Y", "emp_439|글로벌전략센터|송임원|지원2팀|황수빈|G2|DS_G,CL_Y,DA_Y,ML_Y", "emp_440|글로벌전략센터|송임원|지원2팀|강도윤|G3|CL_Y,DOE_Y,TB_G,DS_Y", "emp_441|글로벌전략센터|송임원|지원2팀|강준우|G3|DS_Y,AU_Y,ML_G,TB_Y", "emp_442|글로벌전략센터|송임원|지원2팀|박하준|G3|DOE_Y,CL_Y,DS_Y,AU_G,DV_Y,DA_G", "emp_443|글로벌전략센터|송임원|지원2팀|서서현|G3|TB_GC,PE_GC,AU_GC,DA_Y,ML_GC,DV_G,CL_G,DOE_Y", "emp_444|글로벌전략센터|송임원|지원2팀|송서연|G3|TB_Y,ML_Y,DV_Y,AU_Y", "emp_445|글로벌전략센터|송임원|지원2팀|오도윤|G3|DA_G,ML_G,DV_Y,CL_Y", "emp_446|글로벌전략센터|송임원|지원2팀|오수빈|G3|AU_GC,DS_G,PE_G,DOE_Y,CL_G,ML_Y", "emp_447|글로벌전략센터|송임원|지원2팀|한시우|G3|CL_Y,TB_Y,AU_Y,DA_Y", "emp_448|글로벌전략센터|조임원|연구7팀|강민서|G1|CL_Y,PE_G,ML_Y,DA_GC,PP_G,DOE_G", "emp_449|글로벌전략센터|조임원|연구7팀|박민서|G1|DV_Y,AU_Y,DOE_Y,ML_Y", "emp_450|글로벌전략센터|조임원|연구7팀|송지훈|G1|DA_G,DV_Y,TB_Y,PP_G", "emp_451|글로벌전략센터|조임원|연구7팀|이수빈|G1|DV_G,CL_Y,AU_Y,DOE_Y", "emp_452|글로벌전략센터|조임원|연구7팀|최준우|G1|PE_Y,ML_G,CL_Y,TB_G", "emp_453|글로벌전략센터|조임원|연구7팀|강서연|G2|DS_Y,DA_G,DV_Y,CL_G,PE_Y,PP_B,DOE_SC,AU_SC,ML_Y", "emp_454|글로벌전략센터|조임원|연구7팀|송다은|G2|DV_Y,CL_G,AU_Y,ML_Y", "emp_455|글로벌전략센터|조임원|연구7팀|신수아|G2|DA_Y,AU_Y,DS_G,ML_G", "emp_456|글로벌전략센터|조임원|연구7팀|안지유|G2|AU_Y,PE_Y,DOE_Y,CL_Y", "emp_457|글로벌전략센터|조임원|연구7팀|이윤서|G2|DA_B,ML_SC,DOE_Y,DS_SC,CL_SC,PE_GC,AU_B,PP_SC", "emp_458|글로벌전략센터|조임원|연구7팀|이하은|G2|CL_G,DV_Y,TB_G,DOE_Y", "emp_459|글로벌전략센터|조임원|연구7팀|장서준|G2|DV_G,DOE_Y,PP_G,PE_Y", "emp_460|글로벌전략센터|조임원|연구7팀|정민서|G2|DOE_Y,DA_G,PE_Y,PP_G", "emp_461|글로벌전략센터|조임원|연구7팀|한준우|G2|PE_G,CL_Y,DA_G,ML_Y", "emp_462|글로벌전략센터|조임원|연구7팀|권지훈|G3|DA_G,PP_G,DV_Y,AU_Y", "emp_463|글로벌전략센터|조임원|연구7팀|서지민|G3|PP_Y,CL_Y,AU_Y,DV_Y", "emp_464|글로벌전략센터|조임원|연구7팀|오주원|G3|DS_Y,ML_Y,DOE_GC,PE_G,AU_G,TB_GC", "emp_465|글로벌전략센터|조임원|연구7팀|조서연|G3|TB_SC,DA_B,DOE_SC,CL_G,AU_Y,ML_G", "emp_466|글로벌전략센터|조임원|연구7팀|한예은|G3|ML_G,TB_G,DV_Y,AU_G", "emp_467|글로벌전략센터|조임원|연구7팀|황준우|G3|AU_Y,DOE_G,ML_Y,DS_G", "emp_468|글로벌전략센터|한임원|지원팀|서서연|G1|CL_Y,TB_G,ML_Y,DA_G", "emp_469|글로벌전략센터|한임원|지원팀|임지아|G1|PP_Y,DS_Y,DA_Y,TB_G", "emp_470|글로벌전략센터|한임원|지원팀|전지호|G1|DS_B,TB_B,PP_GC,DA_G,DOE_GC,PE_SC,AU_G", "emp_471|글로벌전략센터|한임원|지원팀|강지민|G2|DA_Y,CL_Y,PE_G,DV_Y", "emp_472|글로벌전략센터|한임원|지원팀|박서현|G2|TB_GC,AU_B,PE_G,PP_Y,ML_Y,CL_B", "emp_473|글로벌전략센터|한임원|지원팀|신하준|G2|DS_Y,DV_Y,TB_Y,DA_Y", "emp_474|글로벌전략센터|한임원|지원팀|전하준|G2|DOE_Y,DS_Y,PE_G,AU_G", "emp_475|글로벌전략센터|한임원|지원팀|한서윤|G2|TB_Y,PP_Y,CL_Y,ML_Y", "emp_476|글로벌전략센터|한임원|지원팀|황하은|G2|AU_Y,CL_SC,ML_G,PE_G,PP_Y,DOE_B", "emp_477|글로벌전략센터|한임원|지원팀|오지아|G3|AU_Y,PP_G,DS_G,CL_Y", "emp_478|글로벌전략센터|한임원|지원팀|윤하윤|G3|AU_G,DA_Y,PP_G,DS_G", "emp_479|글로벌전략센터|한임원|지원팀|임다은|G3|DA_Y,PP_Y,DOE_Y,CL_G", "emp_480|글로벌전략센터|한임원|지원팀|임민준|G3|DV_Y,AU_G,DS_Y,DA_G", "emp_481|글로벌전략센터|한임원|지원팀|조서준|G3|TB_G,AU_GC,DA_SC,CL_GC,DS_B,PE_SC", "emp_482|글로벌전략센터|한임원|지원팀|조수빈|G3|DA_Y,DV_B,PE_B,AU_SC,TB_GC,PP_G", "emp_483|기초소재사업본부|권임원|영업팀|신도윤|G1|DOE_Y,DA_G,PP_Y,CL_Y", "emp_484|기초소재사업본부|권임원|영업팀|임도윤|G1|DS_GC,AU_G,TB_Y,PP_GC,ML_G,PE_G", "emp_485|기초소재사업본부|권임원|영업팀|임서연|G1|ML_G,CL_G,DOE_Y,PP_Y", "emp_486|기초소재사업본부|권임원|영업팀|최하윤|G1|ML_B,CL_G,DOE_SC,DA_G,TB_SC,DS_G", "emp_487|기초소재사업본부|권임원|영업팀|강채원|G2|PE_Y,TB_Y,DA_G,AU_G", "emp_488|기초소재사업본부|권임원|영업팀|송준우|G2|DA_Y,DOE_G,DS_Y,PE_G", "emp_489|기초소재사업본부|권임원|영업팀|신수아|G2|TB_G,ML_G,DS_Y,DA_G", "emp_490|기초소재사업본부|권임원|영업팀|신지우|G2|ML_Y,DV_G,CL_G,AU_G", "emp_491|기초소재사업본부|권임원|영업팀|전수빈|G2|PE_Y,DOE_G,ML_Y,DA_Y", "emp_492|기초소재사업본부|권임원|영업팀|조윤서|G2|AU_SC,PP_B,TB_SC,DS_GC,DV_Y,DA_SC", "emp_493|기초소재사업본부|권임원|영업팀|조지우|G2|CL_Y,DOE_Y,DA_Y,ML_Y", "emp_494|기초소재사업본부|권임원|영업팀|최하준|G2|CL_Y,TB_Y,DV_Y,AU_G", "emp_495|기초소재사업본부|권임원|영업팀|황수아|G2|ML_G,DV_Y,PE_G,AU_G", "emp_496|기초소재사업본부|권임원|영업팀|박준우|G3|ML_G,PP_Y,DA_Y,DV_G", "emp_497|기초소재사업본부|권임원|영업팀|윤하은|G3|DOE_G,DA_Y,PP_B,ML_G,PE_SC,DV_G", "emp_498|기초소재사업본부|권임원|영업팀|조서현|G3|TB_SC,PE_Y,DA_Y,DS_SC,DOE_G,PP_GC,AU_Y,CL_GC", "emp_499|기초소재사업본부|권임원|영업팀|한서준|G3|PP_Y,DS_B,CL_G,AU_B,ML_Y,DOE_Y,TB_SC,DA_GC,DV_SC", "emp_500|기초소재사업본부|권임원|영업팀|홍지아|G3|CL_G,DV_G,PE_G,PP_G", "emp_501|기초소재사업본부|권임원|영업팀|홍하은|G3|DS_G,AU_Y,DV_G,DOE_GC,ML_Y,PP_B", "emp_502|기초소재사업본부|권임원|영업팀|황수아|G3|CL_GC,ML_SC,DA_GC,TB_SC,PP_Y,PE_G", "emp_503|기초소재사업본부|김임원|혁신7팀|신민준|G1|PP_Y,PE_Y,DV_G,DOE_G", "emp_504|기초소재사업본부|김임원|혁신7팀|전수빈|G1|PP_G,CL_Y,ML_Y,DS_Y", "emp_505|기초소재사업본부|김임원|혁신7팀|황서현|G1|ML_Y,DA_Y,DV_G,CL_G,DS_Y,PE_Y", "emp_506|기초소재사업본부|김임원|혁신7팀|강준우|G2|DOE_G,PP_G,ML_G,CL_Y", "emp_507|기초소재사업본부|김임원|혁신7팀|강지호|G2|PE_GC,DOE_Y,CL_B,DV_B,ML_GC,DS_G,AU_B,TB_SC,PP_B", "emp_508|기초소재사업본부|김임원|혁신7팀|김다은|G2|DV_SC,PP_B,DOE_G,AU_B,PE_SC,DS_Y,ML_SC", "emp_509|기초소재사업본부|김임원|혁신7팀|신준우|G2|ML_SC,DV_SC,CL_SC,PE_Y,DA_B,DOE_B,DS_GC,TB_G", "emp_510|기초소재사업본부|김임원|혁신7팀|임도윤|G2|DS_Y,PP_GC,TB_SC,DOE_G,CL_B,PE_Y", "emp_511|기초소재사업본부|김임원|혁신7팀|임하은|G2|CL_G,PP_B,DV_G,DS_SC,TB_G,AU_Y", "emp_512|기초소재사업본부|김임원|혁신7팀|전지민|G2|DV_B,DS_Y,DA_SC,CL_G,PP_B,DOE_SC", "emp_513|기초소재사업본부|김임원|혁신7팀|최지우|G2|DS_G,DA_Y,PP_Y,TB_G", "emp_514|기초소재사업본부|김임원|혁신7팀|서시우|G3|DV_G,DOE_Y,CL_G,DA_G", "emp_515|기초소재사업본부|김임원|혁신7팀|송지유|G3|DV_GC,ML_GC,DOE_Y,PE_Y,DS_G,PP_G", "emp_516|기초소재사업본부|김임원|혁신7팀|신지민|G3|DS_B,DOE_SC,CL_SC,PE_B,DV_Y,ML_G,PP_B,AU_SC,TB_GC,DA_SC", "emp_517|기초소재사업본부|김임원|혁신7팀|윤지유|G3|DOE_G,DV_Y,PP_G,AU_Y,PE_GC,ML_GC", "emp_518|기초소재사업본부|김임원|혁신7팀|이다은|G3|DV_Y,CL_Y,DOE_G,AU_Y", "emp_519|기초소재사업본부|김임원|혁신7팀|조다은|G3|DS_G,TB_Y,CL_Y,DV_Y", "emp_520|기초소재사업본부|김임원|혁신7팀|최지유|G3|DOE_GC,DS_SC,DA_GC,AU_Y,PE_SC,DV_G", "emp_521|기초소재사업본부|김임원|혁신7팀|홍지호|G3|DV_Y,DS_G,PP_Y,TB_Y", "emp_522|기초소재사업본부|윤임원|구매팀|송지민|G1|PE_Y,AU_Y,TB_Y,CL_SC,PP_G,DS_Y", "emp_523|기초소재사업본부|윤임원|구매팀|오예준|G1|DS_G,ML_Y,DOE_G,PE_Y", "emp_524|기초소재사업본부|윤임원|구매팀|임준우|G1|ML_G,PE_G,TB_Y,DS_Y", "emp_525|기초소재사업본부|윤임원|구매팀|장하준|G1|DV_G,PE_Y,AU_Y,ML_Y", "emp_526|기초소재사업본부|윤임원|구매팀|전예준|G2|DOE_G,DA_G,ML_G,PE_G", "emp_527|기초소재사업본부|윤임원|구매팀|전하윤|G2|DV_Y,PP_G,ML_Y,DS_G", "emp_528|기초소재사업본부|윤임원|구매팀|전하준|G2|AU_G,DS_Y,ML_Y,DV_G", "emp_529|기초소재사업본부|윤임원|구매팀|정다은|G2|DA_G,TB_Y,DS_SC,PE_GC,ML_G,CL_G", "emp_530|기초소재사업본부|윤임원|구매팀|조지민|G2|PE_G,DA_Y,PP_Y,DV_G", "emp_531|기초소재사업본부|윤임원|구매팀|최지우|G2|TB_G,PE_G,DOE_Y,PP_Y", "emp_532|기초소재사업본부|윤임원|구매팀|한지훈|G2|ML_G,DA_G,DS_Y,CL_Y", "emp_533|기초소재사업본부|윤임원|구매팀|황윤서|G2|DOE_Y,AU_Y,DS_Y,ML_Y", "emp_534|기초소재사업본부|윤임원|구매팀|강예은|G3|PE_Y,AU_Y,DA_G,TB_Y", "emp_535|기초소재사업본부|윤임원|구매팀|권시우|G3|DA_B,CL_GC,DV_G,PP_B,PE_Y,DOE_SC", "emp_536|기초소재사업본부|윤임원|구매팀|김서현|G3|ML_GC,DV_Y,TB_B,DA_G,PE_Y,DOE_B", "emp_537|기초소재사업본부|윤임원|구매팀|임채원|G3|TB_G,PE_G,AU_G,DA_G", "emp_538|기초소재사업본부|윤임원|구매팀|조민서|G3|DS_G,ML_GC,TB_G,DV_GC,AU_Y,PE_SC", "emp_539|기초소재사업본부|이임원|지원6팀|강서준|G1|DA_G,CL_GC,DS_G,PE_GC,AU_SC,DV_SC", "emp_540|기초소재사업본부|이임원|지원6팀|강준우|G1|DS_G,AU_Y,DA_Y,CL_G", "emp_541|기초소재사업본부|이임원|지원6팀|김지유|G1|DOE_Y,TB_Y,PP_G,DA_Y,DS_SC,DV_GC", "emp_542|기초소재사업본부|이임원|지원6팀|윤서연|G1|CL_B,AU_G,DA_GC,PP_G,TB_G,DOE_G,DV_GC,PE_SC,DS_GC,ML_GC", "emp_543|기초소재사업본부|이임원|지원6팀|정윤서|G1|DV_G,ML_G,TB_Y,AU_G", "emp_544|기초소재사업본부|이임원|지원6팀|홍지호|G1|PP_SC,DOE_GC,AU_B,CL_SC,DA_B,TB_G,ML_SC,PE_SC", "emp_545|기초소재사업본부|이임원|지원6팀|권지민|G2|PE_Y,DS_G,PP_Y,ML_Y", "emp_546|기초소재사업본부|이임원|지원6팀|박지아|G2|DV_B,PP_Y,AU_Y,DS_Y,ML_Y,DOE_Y", "emp_547|기초소재사업본부|이임원|지원6팀|송윤서|G2|PP_G,ML_Y,DOE_Y,AU_G", "emp_548|기초소재사업본부|이임원|지원6팀|전하은|G2|DA_Y,ML_Y,AU_G,DV_Y", "emp_549|기초소재사업본부|이임원|지원6팀|정주원|G2|DA_Y,DS_G,PE_Y,AU_G", "emp_550|기초소재사업본부|이임원|지원6팀|황지유|G2|PE_G,DOE_Y,DA_G,PP_Y", "emp_551|기초소재사업본부|이임원|지원6팀|김지호|G3|PE_GC,AU_G,DA_SC,DOE_GC,TB_B,DS_B,PP_Y,ML_GC,CL_SC,DV_SC", "emp_552|기초소재사업본부|이임원|지원6팀|임하윤|G3|PP_Y,DA_G,DV_Y,DOE_Y,PE_GC,DS_B", "emp_553|기초소재사업본부|전임원|생산7팀|서민서|G1|ML_Y,DS_G,DA_Y,DOE_Y", "emp_554|기초소재사업본부|전임원|생산7팀|안서윤|G1|PP_G,TB_Y,DS_Y,DOE_SC,PE_SC,DA_G", "emp_555|기초소재사업본부|전임원|생산7팀|안지유|G1|ML_Y,DA_G,AU_Y,CL_Y", "emp_556|기초소재사업본부|전임원|생산7팀|황준우|G1|PP_G,ML_Y,DV_Y,DA_G", "emp_557|기초소재사업본부|전임원|생산7팀|김예준|G2|PE_SC,DV_Y,AU_Y,DA_Y,DOE_Y,DS_Y", "emp_558|기초소재사업본부|전임원|생산7팀|송지우|G2|DA_G,DOE_Y,AU_Y,DV_Y", "emp_559|기초소재사업본부|전임원|생산7팀|안채원|G2|DV_G,ML_G,DOE_G,CL_Y", "emp_560|기초소재사업본부|전임원|생산7팀|윤민준|G2|PP_GC,DOE_GC,TB_GC,ML_G,AU_SC,PE_B", "emp_561|기초소재사업본부|전임원|생산7팀|임민준|G2|DA_Y,DV_Y,CL_G,DOE_G", "emp_562|기초소재사업본부|전임원|생산7팀|황다은|G2|DA_Y,ML_Y,AU_Y,CL_G", "emp_563|기초소재사업본부|전임원|생산7팀|황지호|G2|DV_Y,DS_G,PP_G,ML_G", "emp_564|기초소재사업본부|전임원|생산7팀|김하은|G3|ML_Y,DS_G,DV_Y,AU_Y", "emp_565|기초소재사업본부|전임원|생산7팀|신도윤|G3|DOE_Y,DV_SC,PE_G,AU_G,CL_G,ML_Y", "emp_566|기초소재사업본부|전임원|생산7팀|전주원|G3|ML_G,PP_G,PE_Y,DS_G", "emp_567|기초소재사업본부|전임원|생산7팀|조지유|G3|PP_Y,DA_Y,AU_Y,DOE_Y", "emp_568|기초소재사업본부|정임원|기획4팀|강수아|G1|ML_Y,TB_Y,CL_Y,DS_Y", "emp_569|기초소재사업본부|정임원|기획4팀|송지우|G1|CL_Y,PP_Y,DOE_G,TB_Y", "emp_570|기초소재사업본부|정임원|기획4팀|오지아|G1|DA_SC,CL_SC,DV_GC,PE_SC,AU_Y,ML_SC,PP_GC,DS_B", "emp_571|기초소재사업본부|정임원|기획4팀|최서윤|G1|CL_Y,DOE_G,TB_G,ML_Y", "emp_572|기초소재사업본부|정임원|기획4팀|한서연|G1|ML_SC,AU_B,DV_Y,CL_B,DOE_G,PE_SC", "emp_573|기초소재사업본부|정임원|기획4팀|김지호|G2|DV_Y,AU_Y,CL_Y,ML_Y,PP_G,DOE_G", "emp_574|기초소재사업본부|정임원|기획4팀|서채원|G2|TB_Y,ML_G,DV_G,DA_Y", "emp_575|기초소재사업본부|정임원|기획4팀|송민서|G2|DA_G,DS_G,TB_Y,DOE_G", "emp_576|기초소재사업본부|정임원|기획4팀|안서연|G2|PE_B,DA_GC,PP_SC,DOE_B,DS_G,TB_GC,ML_Y,AU_B,DV_G,CL_B", "emp_577|기초소재사업본부|정임원|기획4팀|안윤서|G2|PP_G,TB_Y,CL_B,ML_G,DA_G,PE_SC", "emp_578|기초소재사업본부|정임원|기획4팀|임수빈|G2|PE_Y,TB_SC,DS_G,CL_G,DA_B,ML_Y", "emp_579|기초소재사업본부|정임원|기획4팀|정시우|G2|ML_Y,DV_Y,PP_G,TB_Y,DS_B,CL_GC", "emp_580|기초소재사업본부|정임원|기획4팀|홍다은|G2|DA_G,DS_Y,TB_Y,AU_Y,CL_GC,DV_Y", "emp_581|기초소재사업본부|정임원|기획4팀|홍지민|G2|PE_G,DA_G,ML_B,DOE_Y,DS_G,PP_SC", "emp_582|기초소재사업본부|정임원|기획4팀|권시우|G3|DS_G,ML_Y,DV_Y,PP_G", "emp_583|기초소재사업본부|정임원|기획4팀|김예은|G3|CL_Y,ML_Y,DA_Y,TB_G", "emp_584|기초소재사업본부|정임원|기획4팀|송서현|G3|TB_G,PP_Y,ML_Y,DS_G", "emp_585|기초소재사업본부|정임원|기획4팀|이서연|G3|AU_GC,TB_Y,PE_Y,DV_SC,PP_SC,ML_G", "emp_586|기초소재사업본부|한임원|생산팀|권서준|G1|TB_Y,DS_B,ML_GC,PP_G,DOE_GC,PE_Y", "emp_587|기초소재사업본부|한임원|생산팀|오하준|G1|DV_G,DOE_Y,PP_Y,ML_G", "emp_588|기초소재사업본부|한임원|생산팀|홍서윤|G1|DS_G,ML_Y,AU_G,PE_G", "emp_589|기초소재사업본부|한임원|생산팀|황예준|G1|PE_G,AU_G,DV_Y,DS_Y", "emp_590|기초소재사업본부|한임원|생산팀|강예준|G2|CL_G,AU_G,TB_Y,DOE_Y", "emp_591|기초소재사업본부|한임원|생산팀|권수빈|G2|DV_GC,CL_SC,AU_B,DA_SC,PE_G,DS_SC,TB_GC,DOE_GC,ML_SC,PP_B", "emp_592|기초소재사업본부|한임원|생산팀|김지아|G2|DOE_SC,CL_GC,DS_Y,DV_SC,AU_Y,TB_B,PP_Y", "emp_593|기초소재사업본부|한임원|생산팀|김지호|G2|PP_Y,AU_G,ML_Y,DA_G", "emp_594|기초소재사업본부|한임원|생산팀|송시우|G2|PE_GC,TB_SC,AU_Y,DS_GC,DV_SC,PP_Y,CL_GC,ML_Y,DA_G", "emp_595|기초소재사업본부|한임원|생산팀|임채원|G2|DOE_Y,CL_G,DS_Y,ML_G", "emp_596|기초소재사업본부|한임원|생산팀|장지아|G2|CL_G,DV_Y,DA_Y,DOE_Y", "emp_597|기초소재사업본부|한임원|생산팀|전시우|G2|PP_Y,DA_Y,DOE_Y,CL_G", "emp_598|기초소재사업본부|한임원|생산팀|조다은|G2|PP_Y,DOE_G,AU_Y,DS_Y", "emp_599|기초소재사업본부|한임원|생산팀|한수빈|G2|DA_Y,PE_Y,TB_G,AU_Y", "emp_600|기초소재사업본부|한임원|생산팀|홍서윤|G2|PE_B,TB_SC,DOE_SC,ML_Y,DA_SC,AU_SC,PP_GC,CL_SC,DV_SC,DS_B", "emp_601|기초소재사업본부|한임원|생산팀|황윤서|G2|PP_Y,DS_Y,DOE_Y,TB_Y", "emp_602|기초소재사업본부|한임원|생산팀|박지호|G3|AU_Y,DOE_Y,PE_G,DS_G", "emp_603|기초소재사업본부|한임원|생산팀|안지호|G3|PP_Y,TB_Y,DA_G,ML_Y", "emp_604|기초소재사업본부|한임원|생산팀|윤하준|G3|CL_Y,TB_Y,DS_Y,AU_G", "emp_605|기초소재사업본부|한임원|생산팀|임민준|G3|DOE_G,PP_Y,DV_G,TB_Y", "emp_606|마케팅지원센터|김임원|인사4팀|강지민|G1|DOE_GC,DS_GC,CL_B,DV_SC,TB_GC,DA_Y,PP_SC,PE_GC,ML_B,AU_SC", "emp_607|마케팅지원센터|김임원|인사4팀|윤주원|G1|DOE_G,AU_G,DV_Y,CL_G", "emp_608|마케팅지원센터|김임원|인사4팀|임하은|G1|PE_Y,PP_G,CL_Y,DS_Y", "emp_609|마케팅지원센터|김임원|인사4팀|강지민|G2|PP_Y,CL_G,DV_G,AU_Y", "emp_610|마케팅지원센터|김임원|인사4팀|권채원|G2|AU_Y,ML_G,PE_Y,DS_Y", "emp_611|마케팅지원센터|김임원|인사4팀|박도윤|G2|CL_G,PP_G,DOE_G,DS_G", "emp_612|마케팅지원센터|김임원|인사4팀|임수아|G2|PE_G,AU_B,DV_Y,TB_GC,ML_GC,DA_G", "emp_613|마케팅지원센터|김임원|인사4팀|임채원|G2|AU_G,DOE_G,PE_G,ML_G", "emp_614|마케팅지원센터|김임원|인사4팀|한서현|G2|DV_GC,PE_G,DA_G,ML_Y,AU_SC,PP_B", "emp_615|마케팅지원센터|김임원|인사4팀|홍도윤|G2|AU_GC,DS_GC,PP_G,CL_B,DA_G,DOE_B,TB_GC,PE_SC,ML_SC", "emp_616|마케팅지원센터|김임원|인사4팀|권예은|G3|DS_Y,DA_G,PP_G,PE_Y,DOE_GC,TB_G", "emp_617|마케팅지원센터|김임원|인사4팀|이하준|G3|DA_G,ML_G,CL_G,AU_Y", "emp_618|마케팅지원센터|김임원|인사4팀|임지민|G3|DA_Y,DOE_Y,PP_G,CL_G", "emp_619|마케팅지원센터|김임원|인사4팀|전수빈|G3|TB_Y,DS_G,PE_Y,DA_G", "emp_620|마케팅지원센터|김임원|인사4팀|최예은|G3|DV_Y,DA_Y,PP_Y,DS_G", "emp_621|마케팅지원센터|김임원|인사4팀|한하은|G3|TB_Y,AU_Y,CL_G,DV_G", "emp_622|마케팅지원센터|박임원|사업2팀|강민준|G1|PE_Y,CL_G,AU_Y,PP_Y", "emp_623|마케팅지원센터|박임원|사업2팀|신예준|G1|AU_G,PP_Y,DOE_Y,ML_Y", "emp_624|마케팅지원센터|박임원|사업2팀|임윤서|G1|DOE_SC,DS_G,ML_SC,AU_B,DV_GC,CL_B", "emp_625|마케팅지원센터|박임원|사업2팀|최예준|G1|DS_Y,DOE_Y,CL_G,AU_Y", "emp_626|마케팅지원센터|박임원|사업2팀|한서현|G1|DOE_Y,DV_Y,TB_G,DS_Y", "emp_627|마케팅지원센터|박임원|사업2팀|한서현|G1|TB_G,ML_Y,PP_G,DOE_Y", "emp_628|마케팅지원센터|박임원|사업2팀|강지우|G2|PP_Y,DA_G,DOE_Y,TB_Y", "emp_629|마케팅지원센터|박임원|사업2팀|신지민|G2|ML_Y,PE_Y,DS_Y,DV_Y", "emp_630|마케팅지원센터|박임원|사업2팀|오준우|G2|DV_Y,ML_GC,DA_GC,PP_Y,AU_SC,TB_B", "emp_631|마케팅지원센터|박임원|사업2팀|임지유|G2|PE_Y,DS_G,TB_G,DOE_Y", "emp_632|마케팅지원센터|박임원|사업2팀|임지훈|G2|PE_Y,CL_Y,DOE_Y,TB_Y", "emp_633|마케팅지원센터|박임원|사업2팀|장윤서|G2|AU_Y,TB_G,DA_Y,CL_Y", "emp_634|마케팅지원센터|박임원|사업2팀|최수빈|G2|DA_Y,PP_G,PE_Y,DS_Y,TB_Y,DV_B", "emp_635|마케팅지원센터|박임원|사업2팀|박주원|G3|DV_G,ML_Y,PP_G,TB_G", "emp_636|마케팅지원센터|박임원|사업2팀|서민서|G3|ML_GC,DV_G,DA_Y,PE_GC,TB_GC,DOE_G", "emp_637|마케팅지원센터|박임원|사업2팀|최윤서|G3|DS_G,PP_G,DA_G,ML_Y,CL_G,DOE_G", "emp_638|마케팅지원센터|송임원|생산6팀|서민서|G1|DS_G,DOE_Y,CL_G,PP_Y", "emp_639|마케팅지원센터|송임원|생산6팀|윤하은|G1|DOE_G,AU_Y,DA_G,ML_SC,TB_G,DV_Y", "emp_640|마케팅지원센터|송임원|생산6팀|장하은|G1|DOE_G,PP_Y,DS_Y,AU_Y", "emp_641|마케팅지원센터|송임원|생산6팀|한지호|G1|CL_Y,DV_Y,ML_Y,DA_Y", "emp_642|마케팅지원센터|송임원|생산6팀|홍서연|G1|PE_Y,DOE_G,DS_Y,PP_B,TB_Y,ML_Y", "emp_643|마케팅지원센터|송임원|생산6팀|강하윤|G2|DS_Y,DV_B,PE_GC,CL_G,DOE_GC,PP_SC,DA_GC,TB_B,AU_GC,ML_G", "emp_644|마케팅지원센터|송임원|생산6팀|강하윤|G2|DS_G,PE_Y,ML_Y,AU_Y", "emp_645|마케팅지원센터|송임원|생산6팀|김민서|G2|ML_Y,CL_Y,DV_G,PE_Y", "emp_646|마케팅지원센터|송임원|생산6팀|신서연|G2|DS_Y,TB_G,AU_Y,DA_Y,ML_B,PP_GC", "emp_647|마케팅지원센터|송임원|생산6팀|장준우|G2|ML_Y,CL_Y,DV_B,DS_G,PE_Y,DOE_G", "emp_648|마케팅지원센터|송임원|생산6팀|전수아|G2|DOE_Y,PP_Y,PE_G,DS_G", "emp_649|마케팅지원센터|송임원|생산6팀|정수빈|G2|DA_Y,PE_G,ML_G,PP_G", "emp_650|마케팅지원센터|송임원|생산6팀|한시우|G2|CL_Y,DS_G,ML_G,PP_Y", "emp_651|마케팅지원센터|송임원|생산6팀|강채원|G3|TB_Y,DV_G,PP_Y,DS_G,CL_SC,DOE_SC", "emp_652|마케팅지원센터|송임원|생산6팀|오다은|G3|AU_Y,PP_G,ML_Y,DS_Y", "emp_653|마케팅지원센터|송임원|생산6팀|이주원|G3|CL_Y,TB_Y,ML_Y,DA_G", "emp_654|마케팅지원센터|송임원|생산6팀|장준우|G3|DOE_G,ML_Y,CL_Y,DV_Y", "emp_655|마케팅지원센터|송임원|생산6팀|최시우|G3|DA_SC,DOE_G,AU_GC,ML_G,DS_Y,TB_SC", "emp_656|마케팅지원센터|송임원|생산6팀|한하준|G3|TB_SC,PE_B,ML_Y,PP_SC,DV_SC,CL_GC", "emp_657|마케팅지원센터|송임원|생산6팀|홍서현|G3|PE_G,AU_Y,ML_Y,TB_G", "emp_658|마케팅지원센터|신임원|사업5팀|박도윤|G1|DV_Y,PP_SC,DS_Y,DOE_B,DA_Y,ML_Y", "emp_659|마케팅지원센터|신임원|사업5팀|윤서준|G1|CL_Y,TB_G,AU_G,PP_Y", "emp_660|마케팅지원센터|신임원|사업5팀|한서윤|G1|PP_G,DOE_Y,ML_Y,DV_Y", "emp_661|마케팅지원센터|신임원|사업5팀|홍예준|G1|ML_Y,DS_Y,TB_Y,DV_Y,DOE_GC,PE_GC", "emp_662|마케팅지원센터|신임원|사업5팀|황서준|G1|PP_SC,AU_Y,DS_Y,ML_GC,DA_G,DV_B", "emp_663|마케팅지원센터|신임원|사업5팀|신다은|G2|DV_G,DS_G,CL_Y,PE_Y", "emp_664|마케팅지원센터|신임원|사업5팀|신서현|G2|PP_G,CL_Y,PE_G,DS_Y", "emp_665|마케팅지원센터|신임원|사업5팀|안서윤|G2|DV_Y,PP_G,TB_G,PE_G", "emp_666|마케팅지원센터|신임원|사업5팀|이준우|G2|PE_Y,TB_Y,ML_G,CL_G", "emp_667|마케팅지원센터|신임원|사업5팀|임하은|G2|DA_Y,CL_Y,DOE_SC,TB_GC,PE_SC,DS_Y", "emp_668|마케팅지원센터|신임원|사업5팀|조시우|G2|PE_Y,AU_Y,PP_G,CL_G", "emp_669|마케팅지원센터|신임원|사업5팀|조지유|G2|DA_GC,DV_GC,ML_G,PE_GC,TB_SC,PP_G,DS_B,CL_Y,DOE_Y,AU_G", "emp_670|마케팅지원센터|신임원|사업5팀|한하준|G2|AU_Y,PE_G,DS_Y,PP_Y", "emp_671|마케팅지원센터|신임원|사업5팀|황서연|G2|TB_B,CL_G,DV_SC,DS_GC,DA_SC,PP_Y,ML_G,PE_SC,DOE_SC,AU_SC", "emp_672|마케팅지원센터|신임원|사업5팀|황지호|G2|CL_SC,PE_GC,AU_SC,DV_G,PP_SC,DOE_Y,DA_Y,ML_G", "emp_673|마케팅지원센터|신임원|사업5팀|박하은|G3|CL_Y,PP_Y,AU_Y,DS_Y", "emp_674|마케팅지원센터|신임원|사업5팀|안지호|G3|DOE_G,DV_G,ML_Y,DS_Y", "emp_675|마케팅지원센터|신임원|사업5팀|오지민|G3|PE_G,DV_Y,PP_Y,DOE_Y", "emp_676|마케팅지원센터|신임원|사업5팀|이하준|G3|PE_G,CL_Y,ML_GC,DA_Y,DOE_Y,TB_GC", "emp_677|마케팅지원센터|신임원|사업5팀|한도윤|G3|DOE_Y,AU_Y,DS_Y,DV_G", "emp_678|마케팅지원센터|임임원|인사3팀|권예준|G1|AU_G,DA_G,DV_Y,DS_B,PP_Y,PE_B", "emp_679|마케팅지원센터|임임원|인사3팀|김하윤|G1|TB_Y,DA_G,ML_SC,DV_Y,PP_B,PE_Y", "emp_680|마케팅지원센터|임임원|인사3팀|안예준|G1|TB_G,DS_Y,DV_Y,PE_Y", "emp_681|마케팅지원센터|임임원|인사3팀|오지호|G1|AU_B,PE_SC,ML_B,PP_GC,DOE_Y,TB_B", "emp_682|마케팅지원센터|임임원|인사3팀|윤도윤|G1|DV_Y,DS_Y,CL_Y,PP_Y", "emp_683|마케팅지원센터|임임원|인사3팀|전지민|G1|DA_Y,ML_Y,AU_G,PE_Y", "emp_684|마케팅지원센터|임임원|인사3팀|최시우|G1|TB_Y,PE_Y,CL_Y,DOE_G", "emp_685|마케팅지원센터|임임원|인사3팀|홍윤서|G1|AU_GC,ML_Y,DA_SC,DS_SC,CL_Y,TB_Y", "emp_686|마케팅지원센터|임임원|인사3팀|황지훈|G1|DOE_G,DV_GC,AU_G,ML_SC,PP_G,CL_GC,PE_GC,DA_B", "emp_687|마케팅지원센터|임임원|인사3팀|권하윤|G2|CL_Y,ML_GC,TB_G,AU_Y,DOE_SC,PP_Y", "emp_688|마케팅지원센터|임임원|인사3팀|김하은|G2|AU_G,CL_Y,DS_Y,PE_Y", "emp_689|마케팅지원센터|임임원|인사3팀|신수빈|G2|PE_B,DA_GC,TB_Y,DOE_SC,PP_B,DS_B", "emp_690|마케팅지원센터|임임원|인사3팀|안서준|G2|DOE_Y,PE_G,AU_G,ML_Y", "emp_691|마케팅지원센터|임임원|인사3팀|전서연|G2|AU_G,DOE_SC,DV_GC,PE_B,PP_B,DA_SC", "emp_692|마케팅지원센터|임임원|인사3팀|권지훈|G3|CL_G,PE_B,DOE_GC,PP_Y,AU_GC,ML_Y", "emp_693|마케팅지원센터|임임원|인사3팀|안예준|G3|CL_G,DA_Y,ML_Y,AU_Y", "emp_694|마케팅지원센터|임임원|인사3팀|윤주원|G3|DV_Y,ML_Y,PE_B,DOE_Y,AU_Y,DS_GC", "emp_695|마케팅지원센터|임임원|인사3팀|이윤서|G3|CL_G,AU_G,ML_G,TB_Y", "emp_696|마케팅지원센터|임임원|인사3팀|전윤서|G3|TB_SC,DV_GC,PE_GC,CL_GC,AU_Y,DS_SC,ML_GC,DA_G,DOE_B", "emp_697|마케팅지원센터|조임원|혁신5팀|강윤서|G1|DV_G,DA_Y,PE_G,AU_Y", "emp_698|마케팅지원센터|조임원|혁신5팀|송시우|G1|DOE_Y,DS_Y,ML_G,DA_G", "emp_699|마케팅지원센터|조임원|혁신5팀|신하윤|G1|CL_G,DA_G,DV_G,DS_Y", "emp_700|마케팅지원센터|조임원|혁신5팀|정수아|G1|ML_Y,AU_G,DOE_G,DA_Y", "emp_701|마케팅지원센터|조임원|혁신5팀|최윤서|G1|ML_G,DS_G,AU_Y,TB_Y", "emp_702|마케팅지원센터|조임원|혁신5팀|박민서|G2|CL_G,DA_Y,ML_G,DV_G", "emp_703|마케팅지원센터|조임원|혁신5팀|서준우|G2|TB_G,AU_Y,DV_Y,DOE_G", "emp_704|마케팅지원센터|조임원|혁신5팀|임예은|G2|TB_G,ML_G,DS_Y,DV_Y", "emp_705|마케팅지원센터|조임원|혁신5팀|홍지호|G2|PP_G,DOE_Y,ML_SC,DV_B,PE_Y,DS_SC", "emp_706|마케팅지원센터|조임원|혁신5팀|황서준|G2|DOE_G,DV_Y,PE_Y,PP_G", "emp_707|마케팅지원센터|조임원|혁신5팀|황예준|G2|DV_G,AU_G,DS_B,DA_B,ML_Y,DOE_SC,TB_SC", "emp_708|마케팅지원센터|조임원|혁신5팀|강지호|G3|DV_B,ML_G,TB_B,PE_Y,DA_Y,AU_GC", "emp_709|마케팅지원센터|조임원|혁신5팀|김하윤|G3|TB_G,ML_Y,AU_Y,PP_G", "emp_710|마케팅지원센터|조임원|혁신5팀|신주원|G3|PE_GC,CL_GC,PP_Y,DV_G,TB_SC,DOE_SC,ML_B,DS_B", "emp_711|마케팅지원센터|조임원|혁신5팀|오도윤|G3|DA_Y,PE_B,ML_B,TB_G,CL_G,DV_Y", "emp_712|마케팅지원센터|조임원|혁신5팀|임지우|G3|DOE_G,DS_G,DA_G,AU_G,ML_GC,CL_G", "emp_713|마케팅지원센터|조임원|혁신5팀|장예준|G3|DS_G,AU_Y,DA_Y,PE_GC,PP_G,CL_Y", "emp_714|마케팅지원센터|조임원|혁신5팀|조서현|G3|AU_G,DOE_G,DS_Y,PP_G", "emp_715|물류혁신센터|김임원|인사6팀|강지훈|G1|TB_G,DOE_Y,DV_G,PP_Y", "emp_716|물류혁신센터|김임원|인사6팀|신다은|G1|PP_Y,PE_B,DOE_G,CL_SC,AU_SC,DS_SC,DA_B,DV_G,ML_B", "emp_717|물류혁신센터|김임원|인사6팀|임지훈|G1|DV_G,CL_Y,PE_G,PP_Y", "emp_718|물류혁신센터|김임원|인사6팀|장수빈|G1|DA_G,AU_Y,ML_Y,PP_G", "emp_719|물류혁신센터|김임원|인사6팀|홍다은|G1|PP_Y,DOE_Y,DV_Y,DA_Y", "emp_720|물류혁신센터|김임원|인사6팀|권민서|G2|DS_Y,AU_G,TB_G,DOE_Y", "emp_721|물류혁신센터|김임원|인사6팀|박윤서|G2|DOE_Y,TB_G,PE_Y,AU_G", "emp_722|물류혁신센터|김임원|인사6팀|한지민|G2|TB_Y,DV_Y,CL_Y,PE_Y", "emp_723|물류혁신센터|김임원|인사6팀|권채원|G3|DA_B,AU_Y,PE_Y,ML_GC,CL_Y,DV_GC", "emp_724|물류혁신센터|김임원|인사6팀|김하윤|G3|AU_SC,DA_SC,DS_GC,PP_GC,PE_Y,DOE_B,TB_GC", "emp_725|물류혁신센터|김임원|인사6팀|박준우|G3|PP_SC,TB_GC,AU_Y,DV_SC,DA_Y,DOE_G", "emp_726|물류혁신센터|김임원|인사6팀|송하윤|G3|DV_Y,DA_Y,TB_G,CL_Y", "emp_727|물류혁신센터|김임원|인사6팀|오민서|G3|TB_B,DV_SC,PE_G,DS_SC,PP_Y,AU_B", "emp_728|물류혁신센터|김임원|인사6팀|임민서|G3|AU_G,PP_Y,DV_G,CL_Y", "emp_729|물류혁신센터|박임원|기획6팀|서지유|G1|DS_G,PE_G,DOE_G,CL_Y", "emp_730|물류혁신센터|박임원|기획6팀|안서현|G1|PP_Y,DA_SC,TB_Y,DV_GC,ML_Y,DOE_GC", "emp_731|물류혁신센터|박임원|기획6팀|안하윤|G1|TB_SC,ML_SC,CL_GC,PE_SC,PP_GC,DS_SC,DOE_G,DA_SC,AU_B,DV_SC", "emp_732|물류혁신센터|박임원|기획6팀|장수아|G1|ML_SC,CL_SC,DS_GC,PE_SC,DOE_GC,DA_SC,TB_G,PP_Y", "emp_733|물류혁신센터|박임원|기획6팀|조지호|G1|DS_B,CL_Y,PP_GC,TB_Y,DV_B,AU_G", "emp_734|물류혁신센터|박임원|기획6팀|홍서연|G1|DV_G,DA_Y,AU_Y,CL_Y", "emp_735|물류혁신센터|박임원|기획6팀|권지훈|G2|PP_G,DOE_G,DS_G,PE_G", "emp_736|물류혁신센터|박임원|기획6팀|김지아|G2|AU_G,DS_Y,PE_G,CL_GC,TB_B,PP_Y", "emp_737|물류혁신센터|박임원|기획6팀|박수빈|G2|DOE_Y,DA_G,DS_Y,AU_Y", "emp_738|물류혁신센터|박임원|기획6팀|박하윤|G2|PP_Y,TB_Y,PE_Y,DOE_G", "emp_739|물류혁신센터|박임원|기획6팀|안지아|G2|AU_Y,DV_G,CL_Y,DA_Y", "emp_740|물류혁신센터|박임원|기획6팀|조하은|G2|ML_SC,DS_G,AU_Y,DOE_Y,PE_G,PP_Y", "emp_741|물류혁신센터|박임원|기획6팀|김서연|G3|CL_Y,DA_Y,DOE_G,AU_G", "emp_742|물류혁신센터|박임원|기획6팀|송민준|G3|AU_G,DOE_Y,PP_Y,PE_Y", "emp_743|물류혁신센터|박임원|기획6팀|조서윤|G3|DOE_Y,ML_G,DV_Y,DS_G", "emp_744|물류혁신센터|박임원|기획6팀|최지우|G3|DA_SC,DV_SC,DOE_GC,AU_B,ML_G,PE_GC,DS_G,PP_SC,TB_SC,CL_B", "emp_745|물류혁신센터|박임원|기획6팀|최하윤|G3|ML_G,AU_Y,CL_G,DV_Y", "emp_746|물류혁신센터|박임원|기획6팀|홍하준|G3|AU_G,PP_G,DS_Y,ML_Y", "emp_747|물류혁신센터|송임원|기획7팀|김윤서|G1|TB_Y,DOE_Y,DS_Y,DV_Y", "emp_748|물류혁신센터|송임원|기획7팀|서지아|G1|DOE_Y,CL_G,DV_G,PP_G", "emp_749|물류혁신센터|송임원|기획7팀|윤하준|G1|CL_Y,DS_G,DV_Y,PP_Y", "emp_750|물류혁신센터|송임원|기획7팀|장지우|G1|DA_G,DV_G,ML_Y,CL_Y", "emp_751|물류혁신센터|송임원|기획7팀|정주원|G1|TB_G,DOE_Y,PP_Y,ML_Y", "emp_752|물류혁신센터|송임원|기획7팀|홍하윤|G1|DV_G,DA_Y,DOE_SC,CL_GC,DS_Y,TB_B,PE_Y,AU_B,PP_SC,ML_SC", "emp_753|물류혁신센터|송임원|기획7팀|박예준|G2|TB_Y,DS_Y,ML_Y,PP_G", "emp_754|물류혁신센터|송임원|기획7팀|송도윤|G2|CL_Y,DA_Y,DV_Y,PE_Y", "emp_755|물류혁신센터|송임원|기획7팀|안지훈|G2|TB_G,PE_Y,PP_Y,DV_Y", "emp_756|물류혁신센터|송임원|기획7팀|윤윤서|G2|ML_G,DS_Y,DV_Y,DOE_G,AU_G,DA_Y", "emp_757|물류혁신센터|송임원|기획7팀|임수아|G2|DV_G,PP_G,ML_Y,DA_G", "emp_758|물류혁신센터|송임원|기획7팀|장시우|G2|AU_Y,ML_SC,PE_B,DS_SC,TB_SC,DA_G", "emp_759|물류혁신센터|송임원|기획7팀|정도윤|G2|AU_Y,ML_Y,PP_G,PE_Y", "emp_760|물류혁신센터|송임원|기획7팀|정지호|G2|CL_G,DA_Y,ML_SC,AU_GC,DS_Y,TB_SC", "emp_761|물류혁신센터|송임원|기획7팀|조수빈|G2|PE_G,AU_Y,CL_G,DS_Y", "emp_762|물류혁신센터|송임원|기획7팀|홍다은|G2|PP_Y,AU_G,ML_Y,DA_G", "emp_763|물류혁신센터|송임원|기획7팀|홍지호|G2|ML_G,AU_Y,DV_Y,DA_G", "emp_764|물류혁신센터|송임원|기획7팀|송채원|G3|DV_Y,DOE_G,AU_G,CL_Y", "emp_765|물류혁신센터|송임원|기획7팀|장민준|G3|PP_SC,DV_GC,CL_B,PE_Y,ML_SC,DS_G", "emp_766|물류혁신센터|송임원|기획7팀|전민준|G3|PE_G,CL_G,DV_G,ML_G", "emp_767|물류혁신센터|신임원|지원7팀|강서연|G1|DS_Y,CL_B,DOE_B,DV_Y,PE_SC,TB_Y", "emp_768|물류혁신센터|신임원|지원7팀|김민준|G1|CL_GC,AU_G,DV_GC,DOE_B,PP_GC,TB_SC,ML_SC,DS_GC", "emp_769|물류혁신센터|신임원|지원7팀|박서준|G1|DA_Y,DS_GC,ML_GC,AU_GC,DV_SC,PP_G", "emp_770|물류혁신센터|신임원|지원7팀|박예준|G1|PE_SC,DS_B,PP_B,DA_Y,ML_GC,AU_SC,DV_GC", "emp_771|물류혁신센터|신임원|지원7팀|안서윤|G1|DOE_G,PP_G,PE_Y,ML_Y", "emp_772|물류혁신센터|신임원|지원7팀|강서준|G2|DA_Y,DV_G,CL_G,ML_Y", "emp_773|물류혁신센터|신임원|지원7팀|권민서|G2|DA_G,TB_Y,PP_Y,PE_Y", "emp_774|물류혁신센터|신임원|지원7팀|박서준|G2|PE_SC,AU_GC,DA_SC,TB_SC,PP_GC,DV_Y", "emp_775|물류혁신센터|신임원|지원7팀|안지민|G2|ML_Y,DS_G,DA_GC,CL_GC,DV_GC,PP_SC,DOE_SC,PE_SC", "emp_776|물류혁신센터|신임원|지원7팀|강하은|G3|PP_G,DA_Y,AU_Y,DV_G", "emp_777|물류혁신센터|신임원|지원7팀|권수아|G3|CL_GC,TB_B,DOE_SC,AU_SC,DA_G,PP_G", "emp_778|물류혁신센터|신임원|지원7팀|김지민|G3|AU_GC,DA_Y,DV_Y,PP_SC,TB_B,ML_GC,DS_B,DOE_SC,PE_SC,CL_SC", "emp_779|물류혁신센터|신임원|지원7팀|안지아|G3|DV_Y,PP_Y,DA_Y,CL_Y", "emp_780|물류혁신센터|신임원|지원7팀|안하준|G3|TB_G,DOE_Y,ML_G,DV_B,DS_GC,AU_SC", "emp_781|물류혁신센터|신임원|지원7팀|임하준|G3|DA_G,CL_Y,PP_Y,TB_Y", "emp_782|물류혁신센터|신임원|지원7팀|정지아|G3|DA_Y,AU_Y,ML_G,PE_Y", "emp_783|물류혁신센터|신임원|지원7팀|한서연|G3|CL_Y,PE_G,DS_Y,TB_G", "emp_784|물류혁신센터|신임원|지원7팀|황서윤|G3|TB_SC,PP_SC,AU_G,DS_G,CL_GC,DOE_Y", "emp_785|물류혁신센터|임임원|연구6팀|김서현|G1|DV_SC,TB_SC,ML_G,DS_GC,PE_SC,PP_B", "emp_786|물류혁신센터|임임원|연구6팀|최수아|G1|TB_Y,DS_Y,DOE_G,DA_Y", "emp_787|물류혁신센터|임임원|연구6팀|홍시우|G1|ML_G,DOE_Y,PP_Y,DV_G", "emp_788|물류혁신센터|임임원|연구6팀|황하은|G1|ML_G,DV_Y,AU_G,CL_G", "emp_789|물류혁신센터|임임원|연구6팀|강지호|G2|DA_G,PE_G,PP_G,TB_Y", "emp_790|물류혁신센터|임임원|연구6팀|권서준|G2|DS_GC,PE_Y,DV_Y,DOE_SC,AU_B,PP_B", "emp_791|물류혁신센터|임임원|연구6팀|신지우|G2|ML_Y,CL_Y,DV_Y,PP_Y", "emp_792|물류혁신센터|임임원|연구6팀|이수아|G2|DS_Y,CL_Y,PP_Y,DOE_Y", "emp_793|물류혁신센터|임임원|연구6팀|정수빈|G2|TB_G,ML_G,DV_GC,DOE_G,DS_B,AU_B", "emp_794|물류혁신센터|임임원|연구6팀|정하준|G2|DV_G,PP_Y,TB_G,DOE_Y", "emp_795|물류혁신센터|임임원|연구6팀|홍주원|G2|DOE_G,DA_Y,DS_Y,PE_Y", "emp_796|물류혁신센터|임임원|연구6팀|황서윤|G2|DA_G,DS_Y,PE_Y,PP_Y", "emp_797|물류혁신센터|임임원|연구6팀|강지아|G3|ML_Y,PE_G,DV_Y,DOE_Y", "emp_798|물류혁신센터|임임원|연구6팀|송다은|G3|PP_Y,CL_G,DA_Y,DS_G", "emp_799|물류혁신센터|임임원|연구6팀|안시우|G3|PP_G,DOE_Y,DV_G,CL_G,PE_G,ML_G", "emp_800|물류혁신센터|임임원|연구6팀|오지유|G3|PE_SC,TB_SC,ML_Y,DV_GC,AU_GC,DOE_Y,DA_B", "emp_801|물류혁신센터|임임원|연구6팀|이서윤|G3|DA_Y,DV_G,AU_G,PP_Y", "emp_802|물류혁신센터|임임원|연구6팀|이준우|G3|PP_B,DA_GC,PE_B,AU_SC,CL_G,DV_SC,DS_B,DOE_GC", "emp_803|물류혁신센터|임임원|연구6팀|임하은|G3|DA_Y,DS_Y,TB_G,DV_Y", "emp_804|물류혁신센터|임임원|연구6팀|조지호|G3|CL_SC,PP_SC,DOE_GC,DS_SC,PE_GC,AU_G,TB_B", "emp_805|물류혁신센터|정임원|기술팀|박채원|G1|DOE_G,CL_G,PP_Y,DA_G", "emp_806|물류혁신센터|정임원|기술팀|안민서|G1|DS_Y,ML_Y,TB_G,DA_Y", "emp_807|물류혁신센터|정임원|기술팀|오지우|G1|DOE_Y,AU_GC,DS_G,PE_GC,CL_G,TB_GC", "emp_808|물류혁신센터|정임원|기술팀|이수아|G1|ML_Y,DA_SC,AU_G,TB_GC,DS_Y,CL_B", "emp_809|물류혁신센터|정임원|기술팀|장지우|G1|DOE_G,PE_Y,DV_Y,AU_Y", "emp_810|물류혁신센터|정임원|기술팀|강민서|G2|DV_G,PP_Y,ML_Y,TB_Y", "emp_811|물류혁신센터|정임원|기술팀|권하준|G2|TB_Y,DOE_G,AU_G,PP_G", "emp_812|물류혁신센터|정임원|기술팀|박준우|G2|DA_Y,PP_Y,DS_Y,PE_G", "emp_813|물류혁신센터|정임원|기술팀|박지아|G2|DV_GC,PE_Y,PP_B,CL_SC,DOE_SC,AU_B,ML_GC,DS_SC,TB_B", "emp_814|물류혁신센터|정임원|기술팀|서수빈|G2|DS_Y,TB_G,AU_Y,CL_Y", "emp_815|물류혁신센터|정임원|기술팀|오지유|G2|PE_Y,DS_G,PP_SC,DOE_GC,TB_G,DA_GC", "emp_816|물류혁신센터|정임원|기술팀|이하윤|G2|ML_Y,DA_G,PE_G,TB_G", "emp_817|물류혁신센터|정임원|기술팀|임시우|G2|DOE_Y,DS_GC,PP_Y,ML_SC,DV_Y,TB_SC", "emp_818|물류혁신센터|정임원|기술팀|정주원|G2|PE_Y,DOE_Y,AU_Y,DS_Y", "emp_819|물류혁신센터|정임원|기술팀|정지민|G2|DV_SC,PE_SC,DOE_B,DA_SC,ML_SC,CL_Y,DS_GC,PP_GC,TB_SC,AU_B", "emp_820|물류혁신센터|정임원|기술팀|권지유|G3|DOE_GC,PP_Y,PE_Y,ML_B,CL_G,DA_B", "emp_821|물류혁신센터|정임원|기술팀|김서현|G3|CL_Y,PE_G,DV_Y,ML_GC,PP_B,AU_G", "emp_822|물류혁신센터|정임원|기술팀|박다은|G3|TB_G,ML_Y,DA_G,PP_Y", "emp_823|물류혁신센터|정임원|기술팀|송하윤|G3|AU_Y,TB_Y,CL_G,ML_Y", "emp_824|물류혁신센터|정임원|기술팀|신윤서|G3|DV_Y,TB_B,DOE_Y,DA_B,AU_GC,PP_G", "emp_825|물류혁신센터|조임원|품질7팀|김주원|G1|AU_Y,DA_Y,DV_Y,TB_Y", "emp_826|물류혁신센터|조임원|품질7팀|박하은|G1|ML_SC,DS_Y,CL_GC,DOE_SC,DA_Y,TB_Y,DV_GC", "emp_827|물류혁신센터|조임원|품질7팀|송하은|G1|TB_GC,AU_GC,DA_GC,DV_B,PE_B,DOE_G", "emp_828|물류혁신센터|조임원|품질7팀|신윤서|G1|PP_B,PE_Y,DV_G,DA_SC,DS_Y,AU_G", "emp_829|물류혁신센터|조임원|품질7팀|최시우|G1|TB_SC,AU_Y,PE_Y,PP_GC,ML_B,CL_G", "emp_830|물류혁신센터|조임원|품질7팀|한민준|G1|ML_Y,TB_Y,DOE_G,CL_Y", "emp_831|물류혁신센터|조임원|품질7팀|홍하은|G1|PE_Y,DOE_G,AU_Y,DA_G", "emp_832|물류혁신센터|조임원|품질7팀|서서준|G2|DA_Y,DS_G,PE_G,TB_B,DOE_B,DV_Y", "emp_833|물류혁신센터|조임원|품질7팀|송민준|G2|DV_Y,PP_Y,PE_Y,AU_Y,DA_B,TB_Y", "emp_834|물류혁신센터|조임원|품질7팀|윤지훈|G2|TB_Y,AU_Y,ML_Y,PP_G", "emp_835|물류혁신센터|조임원|품질7팀|이서연|G2|DS_SC,DV_G,PP_B,CL_B,PE_G,AU_B", "emp_836|물류혁신센터|조임원|품질7팀|서수빈|G3|PE_Y,CL_SC,DS_G,ML_Y,DA_B,DV_B", "emp_837|물류혁신센터|조임원|품질7팀|오서윤|G3|AU_G,PE_Y,CL_G,DS_G", "emp_838|물류혁신센터|조임원|품질7팀|홍지유|G3|DV_GC,ML_Y,PE_GC,CL_GC,DA_SC,TB_Y,PP_SC,DS_GC,DOE_SC", "emp_839|바이오사업본부|김임원|연구4팀|권지훈|G1|CL_SC,TB_B,ML_SC,DA_GC,PP_G,AU_B,DS_G", "emp_840|바이오사업본부|김임원|연구4팀|김주원|G1|DV_Y,DS_GC,PP_Y,DA_SC,AU_B,ML_Y", "emp_841|바이오사업본부|김임원|연구4팀|신지훈|G1|DV_Y,TB_Y,DOE_G,PE_G", "emp_842|바이오사업본부|김임원|연구4팀|안하준|G1|ML_SC,CL_B,DOE_G,PP_Y,DA_Y,DS_G", "emp_843|바이오사업본부|김임원|연구4팀|이서윤|G1|DV_G,DA_GC,DOE_B,TB_Y,ML_G,PP_SC", "emp_844|바이오사업본부|김임원|연구4팀|장주원|G1|TB_G,DS_Y,PE_Y,PP_G", "emp_845|바이오사업본부|김임원|연구4팀|홍수빈|G1|PP_G,ML_Y,TB_Y,AU_G", "emp_846|바이오사업본부|김임원|연구4팀|송준우|G2|AU_Y,DS_Y,DOE_G,DA_G", "emp_847|바이오사업본부|김임원|연구4팀|안예은|G2|PE_G,DA_Y,ML_G,DV_G", "emp_848|바이오사업본부|김임원|연구4팀|오민서|G2|DOE_Y,CL_Y,AU_Y,DV_Y", "emp_849|바이오사업본부|김임원|연구4팀|임수아|G2|AU_G,CL_Y,DOE_G,ML_Y", "emp_850|바이오사업본부|김임원|연구4팀|임지유|G2|ML_G,AU_Y,CL_G,DA_G,PP_Y,DOE_GC", "emp_851|바이오사업본부|김임원|연구4팀|전지아|G2|DA_SC,DS_Y,TB_B,PE_B,CL_G,DOE_Y", "emp_852|바이오사업본부|김임원|연구4팀|송수빈|G3|PE_B,ML_G,CL_GC,AU_G,DA_GC,TB_G", "emp_853|바이오사업본부|김임원|연구4팀|안지훈|G3|DS_Y,PP_Y,DA_Y,AU_Y", "emp_854|바이오사업본부|김임원|연구4팀|오준우|G3|CL_SC,AU_GC,DS_G,PP_B,DV_G,DA_Y", "emp_855|바이오사업본부|김임원|연구4팀|이민준|G3|ML_Y,DV_Y,PE_Y,DA_G", "emp_856|바이오사업본부|김임원|연구4팀|장지훈|G3|ML_Y,DV_G,PP_Y,PE_G", "emp_857|바이오사업본부|김임원|연구4팀|홍다은|G3|DV_Y,DOE_G,PE_G,PP_G,CL_Y,ML_GC", "emp_858|바이오사업본부|김임원|연구4팀|홍도윤|G3|DA_Y,DV_G,ML_G,TB_Y", "emp_859|바이오사업본부|박임원|인사팀|박서현|G1|AU_Y,PE_Y,DV_Y,PP_Y", "emp_860|바이오사업본부|박임원|인사팀|오수빈|G1|DV_SC,DOE_Y,CL_GC,TB_GC,DS_SC,DA_Y,ML_SC,PP_SC,PE_Y,AU_SC", "emp_861|바이오사업본부|박임원|인사팀|윤민준|G1|ML_G,PP_G,CL_G,AU_Y", "emp_862|바이오사업본부|박임원|인사팀|윤예준|G1|CL_Y,DA_Y,DOE_Y,PP_G", "emp_863|바이오사업본부|박임원|인사팀|정도윤|G1|PP_G,DA_Y,CL_Y,DS_Y", "emp_864|바이오사업본부|박임원|인사팀|한민준|G1|AU_G,DV_Y,DS_Y,DA_G", "emp_865|바이오사업본부|박임원|인사팀|권수빈|G2|PE_GC,AU_SC,CL_Y,PP_B,DV_B,DA_GC,DOE_SC,ML_G", "emp_866|바이오사업본부|박임원|인사팀|이준우|G2|DOE_G,DV_SC,ML_GC,TB_G,DA_B,PP_GC", "emp_867|바이오사업본부|박임원|인사팀|정지유|G2|DV_G,ML_B,DS_Y,PE_SC,DOE_Y,AU_GC", "emp_868|바이오사업본부|박임원|인사팀|정하준|G2|DS_GC,PP_Y,CL_Y,DOE_Y,TB_G,ML_Y", "emp_869|바이오사업본부|박임원|인사팀|조지유|G2|DV_Y,AU_G,DOE_G,PP_G", "emp_870|바이오사업본부|박임원|인사팀|최서윤|G2|DV_G,PP_B,DS_G,PE_GC,TB_G,DA_GC", "emp_871|바이오사업본부|박임원|인사팀|한지유|G2|PE_G,ML_B,DV_B,TB_GC,DA_G,DOE_SC", "emp_872|바이오사업본부|박임원|인사팀|강하윤|G3|AU_SC,TB_B,DV_G,CL_B,PE_Y,DA_SC", "emp_873|바이오사업본부|박임원|인사팀|박민서|G3|PP_Y,PE_Y,DS_G,AU_Y,CL_GC,DA_G", "emp_874|바이오사업본부|박임원|인사팀|송서현|G3|DS_Y,DA_Y,DOE_G,TB_G", "emp_875|바이오사업본부|박임원|인사팀|신수빈|G3|PE_Y,DV_G,TB_Y,ML_GC,DA_B,AU_SC", "emp_876|바이오사업본부|박임원|인사팀|안지민|G3|DS_Y,DOE_Y,CL_Y,TB_Y", "emp_877|바이오사업본부|박임원|인사팀|오민서|G3|CL_G,DS_G,DA_G,PP_Y", "emp_878|바이오사업본부|오임원|연구5팀|강지우|G1|DV_Y,PP_Y,TB_Y,ML_G", "emp_879|바이오사업본부|오임원|연구5팀|김도윤|G1|PP_Y,CL_G,TB_Y,DOE_Y", "emp_880|바이오사업본부|오임원|연구5팀|윤채원|G1|PE_Y,DV_Y,DOE_G,DS_G", "emp_881|바이오사업본부|오임원|연구5팀|조주원|G1|DA_G,PP_G,DV_Y,ML_G", "emp_882|바이오사업본부|오임원|연구5팀|최예은|G1|AU_Y,DV_G,ML_G,DA_G,DOE_G,PE_GC", "emp_883|바이오사업본부|오임원|연구5팀|최지민|G1|TB_Y,PE_Y,DA_G,AU_Y", "emp_884|바이오사업본부|오임원|연구5팀|강예준|G2|DS_G,PP_G,ML_Y,AU_Y", "emp_885|바이오사업본부|오임원|연구5팀|서서연|G2|CL_G,TB_Y,DS_G,PP_Y", "emp_886|바이오사업본부|오임원|연구5팀|장서연|G2|DS_SC,DA_SC,DOE_G,AU_G,CL_SC,TB_GC,PE_Y,ML_B,PP_Y", "emp_887|바이오사업본부|오임원|연구5팀|전민서|G2|DS_G,ML_G,DOE_Y,AU_GC,DV_G,DA_GC", "emp_888|바이오사업본부|오임원|연구5팀|정서현|G2|DOE_Y,DA_Y,DS_G,ML_Y", "emp_889|바이오사업본부|오임원|연구5팀|강민서|G3|DS_G,CL_Y,TB_G,DV_Y,ML_G,PE_GC", "emp_890|바이오사업본부|오임원|연구5팀|권도윤|G3|DOE_Y,DA_G,CL_G,PP_Y", "emp_891|바이오사업본부|오임원|연구5팀|권서연|G3|DV_Y,DS_G,DOE_Y,CL_G", "emp_892|바이오사업본부|오임원|연구5팀|송하준|G3|PE_GC,DS_B,CL_G,AU_G,PP_G,TB_Y,DA_GC,DOE_Y,DV_G,ML_SC", "emp_893|바이오사업본부|오임원|연구5팀|오준우|G3|DOE_Y,DA_Y,PE_G,AU_Y", "emp_894|바이오사업본부|오임원|연구5팀|임지우|G3|AU_G,CL_G,DA_Y,PP_G", "emp_895|바이오사업본부|장임원|관리팀|윤지유|G1|AU_GC,TB_Y,DOE_B,PE_SC,CL_SC,DS_Y,PP_GC,DA_G", "emp_896|바이오사업본부|장임원|관리팀|장민서|G1|TB_Y,DV_GC,DS_SC,PE_GC,AU_Y,PP_G", "emp_897|바이오사업본부|장임원|관리팀|장지민|G1|DV_SC,DS_G,DA_B,AU_GC,CL_G,PP_B", "emp_898|바이오사업본부|장임원|관리팀|전지유|G1|DA_B,PP_G,CL_B,DV_SC,ML_GC,PE_G", "emp_899|바이오사업본부|장임원|관리팀|정지우|G1|PP_G,DV_G,ML_SC,TB_Y,PE_GC,CL_SC,DS_SC,DOE_G,AU_GC,DA_G", "emp_900|바이오사업본부|장임원|관리팀|한예준|G1|AU_G,CL_B,ML_SC,DV_G,PE_Y,DA_Y", "emp_901|바이오사업본부|장임원|관리팀|황서연|G1|AU_G,DS_G,PE_Y,ML_G", "emp_902|바이오사업본부|장임원|관리팀|김민서|G2|PP_G,DS_G,CL_Y,DA_Y", "emp_903|바이오사업본부|장임원|관리팀|박지아|G2|DV_Y,PP_Y,ML_Y,DS_G", "emp_904|바이오사업본부|장임원|관리팀|서민서|G2|ML_B,DV_GC,CL_B,PE_SC,DS_Y,DA_G", "emp_905|바이오사업본부|장임원|관리팀|송하준|G2|TB_B,PE_SC,DA_B,DOE_B,PP_Y,AU_G", "emp_906|바이오사업본부|장임원|관리팀|임지아|G2|ML_Y,TB_Y,AU_Y,CL_Y", "emp_907|바이오사업본부|장임원|관리팀|한민준|G2|DA_Y,AU_Y,CL_Y,DOE_G", "emp_908|바이오사업본부|장임원|관리팀|권다은|G3|AU_GC,DV_GC,PE_GC,PP_GC,ML_SC,DOE_SC,DA_Y,CL_SC,DS_GC", "emp_909|바이오사업본부|장임원|관리팀|이서준|G3|PE_G,DV_G,TB_G,DA_G", "emp_910|바이오사업본부|장임원|관리팀|한하은|G3|PE_Y,TB_Y,DOE_Y,ML_G", "emp_911|바이오사업본부|장임원|관리팀|홍지훈|G3|AU_Y,DS_Y,CL_Y,ML_G", "emp_912|바이오사업본부|장임원|관리팀|황도윤|G3|CL_G,AU_G,DV_Y,ML_Y", "emp_913|바이오사업본부|전임원|전략팀|박예은|G1|DS_Y,ML_G,DV_Y,TB_G", "emp_914|바이오사업본부|전임원|전략팀|박지아|G1|CL_Y,DV_Y,ML_G,PP_G", "emp_915|바이오사업본부|전임원|전략팀|임윤서|G1|TB_SC,DV_G,AU_SC,ML_G,PP_GC,PE_SC,DOE_B", "emp_916|바이오사업본부|전임원|전략팀|최수아|G1|PE_G,DS_G,DA_Y,DOE_Y", "emp_917|바이오사업본부|전임원|전략팀|송수빈|G2|CL_Y,PP_Y,DV_G,PE_Y", "emp_918|바이오사업본부|전임원|전략팀|송윤서|G2|DS_G,DA_G,PP_G,CL_GC,DOE_GC,TB_Y", "emp_919|바이오사업본부|전임원|전략팀|송하윤|G2|TB_Y,PE_G,DOE_Y,AU_Y", "emp_920|바이오사업본부|전임원|전략팀|황서윤|G2|CL_Y,PE_Y,PP_G,DS_Y", "emp_921|바이오사업본부|전임원|전략팀|김하은|G3|DV_SC,DOE_B,PE_G,AU_SC,CL_G,PP_GC", "emp_922|바이오사업본부|전임원|전략팀|박지호|G3|DA_Y,TB_G,AU_G,PE_Y", "emp_923|바이오사업본부|전임원|전략팀|전예준|G3|ML_Y,PE_G,CL_G,PP_Y,DV_Y,DS_Y", "emp_924|바이오사업본부|전임원|전략팀|정지유|G3|DS_G,DV_Y,PE_G,AU_G", "emp_925|바이오사업본부|전임원|전략팀|최수아|G3|ML_G,AU_Y,CL_Y,PP_G,DA_GC,TB_G", "emp_926|바이오사업본부|전임원|전략팀|최예은|G3|TB_Y,DV_G,AU_Y,PP_Y", "emp_927|바이오사업본부|정임원|생산5팀|정지훈|G1|DA_Y,DS_GC,TB_G,DOE_GC,ML_SC,CL_SC,PE_SC,AU_GC", "emp_928|바이오사업본부|정임원|생산5팀|황지호|G1|AU_G,CL_Y,DS_SC,PP_Y,DA_G,PE_GC", "emp_929|바이오사업본부|정임원|생산5팀|김준우|G2|AU_B,DV_G,PP_Y,DS_B,DOE_G,DA_Y", "emp_930|바이오사업본부|정임원|생산5팀|윤민준|G2|CL_Y,DV_Y,PP_G,DOE_Y", "emp_931|바이오사업본부|정임원|생산5팀|임수아|G2|PE_G,ML_G,DS_B,PP_SC,AU_Y,DA_GC", "emp_932|바이오사업본부|정임원|생산5팀|장민서|G2|TB_B,CL_G,PE_GC,DOE_Y,ML_Y,DS_SC", "emp_933|바이오사업본부|정임원|생산5팀|한수빈|G2|TB_Y,CL_Y,AU_Y,PE_Y", "emp_934|바이오사업본부|정임원|생산5팀|강하은|G3|DS_G,CL_GC,ML_Y,DV_SC,AU_GC,DOE_SC,PE_Y,TB_SC", "emp_935|바이오사업본부|정임원|생산5팀|김수아|G3|PE_Y,DOE_G,AU_Y,DS_Y", "emp_936|바이오사업본부|정임원|생산5팀|장하윤|G3|TB_Y,CL_B,ML_B,AU_G,PE_Y,DS_GC", "emp_937|바이오사업본부|정임원|생산5팀|전지우|G3|CL_Y,PE_G,DA_G,PP_Y", "emp_938|바이오사업본부|정임원|생산5팀|한지우|G3|DV_G,PE_G,DA_G,DOE_Y,ML_GC,CL_SC", "emp_939|바이오사업본부|정임원|생산5팀|홍지민|G3|DV_G,DS_G,PE_G,DOE_G,TB_SC,PP_SC", "emp_940|바이오사업본부|정임원|생산5팀|황윤서|G3|AU_G,CL_SC,DOE_GC,DA_G,PP_G,DV_B", "emp_941|바이오사업본부|황임원|생산3팀|김지민|G1|PP_Y,PE_G,DOE_Y,CL_Y", "emp_942|바이오사업본부|황임원|생산3팀|송지아|G1|DV_Y,ML_Y,DA_G,PE_GC,PP_Y,DS_Y", "emp_943|바이오사업본부|황임원|생산3팀|안도윤|G1|AU_Y,ML_Y,CL_Y,DA_Y", "emp_944|바이오사업본부|황임원|생산3팀|안수아|G1|DV_Y,PE_Y,CL_G,DOE_G,ML_GC,DA_Y", "emp_945|바이오사업본부|황임원|생산3팀|장윤서|G1|CL_Y,PE_G,ML_G,DOE_Y", "emp_946|바이오사업본부|황임원|생산3팀|한지민|G1|ML_Y,TB_G,PP_Y,DS_Y", "emp_947|바이오사업본부|황임원|생산3팀|강예은|G2|DOE_B,DV_GC,DS_G,ML_Y,AU_G,CL_Y", "emp_948|바이오사업본부|황임원|생산3팀|서수빈|G2|DA_Y,ML_Y,AU_G,CL_Y", "emp_949|바이오사업본부|황임원|생산3팀|서지훈|G2|DOE_G,DA_Y,PE_Y,ML_G", "emp_950|바이오사업본부|황임원|생산3팀|송지유|G2|DS_G,PP_Y,ML_SC,PE_G,AU_Y,CL_B", "emp_951|바이오사업본부|황임원|생산3팀|오서연|G2|DA_Y,TB_Y,ML_G,AU_Y", "emp_952|바이오사업본부|황임원|생산3팀|전서윤|G2|PE_G,TB_G,DOE_Y,DA_G", "emp_953|바이오사업본부|황임원|생산3팀|박준우|G3|DA_G,AU_Y,PP_G,DS_Y", "emp_954|바이오사업본부|황임원|생산3팀|서수아|G3|ML_GC,AU_SC,CL_Y,PP_B,DV_B,DS_G,DOE_GC", "emp_955|바이오사업본부|황임원|생산3팀|송서연|G3|DA_G,CL_Y,AU_G,DS_G", "emp_956|바이오사업본부|황임원|생산3팀|최서연|G3|TB_Y,AU_G,DV_G,PP_Y", "emp_957|바이오사업본부|황임원|생산3팀|황지유|G3|CL_Y,ML_G,TB_G,DV_G", "emp_958|생산기술센터|강임원|사업팀|신도윤|G1|CL_G,DA_Y,DV_G,PP_G", "emp_959|생산기술센터|강임원|사업팀|윤다은|G1|TB_GC,DV_Y,AU_B,PP_Y,PE_SC,DA_G", "emp_960|생산기술센터|강임원|사업팀|장민서|G1|PE_Y,TB_Y,DOE_G,DS_Y", "emp_961|생산기술센터|강임원|사업팀|전시우|G1|AU_Y,PP_G,ML_G,TB_Y", "emp_962|생산기술센터|강임원|사업팀|권수아|G2|DV_Y,TB_Y,DOE_Y,DS_Y", "emp_963|생산기술센터|강임원|사업팀|김지훈|G2|ML_B,TB_Y,PE_SC,DS_B,DA_GC,PP_SC,DOE_Y", "emp_964|생산기술센터|강임원|사업팀|송하준|G2|CL_G,PE_Y,DA_G,ML_G", "emp_965|생산기술센터|강임원|사업팀|신서연|G2|DOE_SC,PP_Y,ML_B,CL_Y,PE_B,DS_G", "emp_966|생산기술센터|강임원|사업팀|안수아|G2|ML_G,DOE_Y,TB_G,DA_G", "emp_967|생산기술센터|강임원|사업팀|전하은|G2|AU_G,DV_G,CL_Y,ML_Y", "emp_968|생산기술센터|강임원|사업팀|황하윤|G2|CL_G,DV_G,TB_SC,PE_Y,ML_Y,DOE_G", "emp_969|생산기술센터|강임원|사업팀|강서윤|G3|DV_G,ML_B,DA_SC,CL_GC,AU_SC,PP_SC,DS_GC,TB_SC,PE_GC", "emp_970|생산기술센터|강임원|사업팀|박시우|G3|AU_SC,PP_G,DOE_G,TB_Y,CL_GC,DA_G", "emp_971|생산기술센터|강임원|사업팀|신서준|G3|DS_Y,PE_G,AU_Y,ML_G", "emp_972|생산기술센터|강임원|사업팀|임수아|G3|TB_G,DA_G,AU_Y,PP_Y", "emp_973|생산기술센터|김임원|구매5팀|권서연|G1|DS_GC,AU_GC,PP_B,CL_G,TB_GC,DOE_SC,DV_Y", "emp_974|생산기술센터|김임원|구매5팀|권지아|G1|AU_Y,DA_G,DS_Y,ML_G", "emp_975|생산기술센터|김임원|구매5팀|윤예은|G1|DA_SC,AU_Y,PP_G,PE_Y,CL_G,TB_GC", "emp_976|생산기술센터|김임원|구매5팀|최하은|G1|DS_B,CL_Y,DV_Y,PP_G,PE_GC,DA_SC", "emp_977|생산기술센터|김임원|구매5팀|박수빈|G2|DA_Y,CL_Y,ML_G,PE_G", "emp_978|생산기술센터|김임원|구매5팀|신서현|G2|CL_G,DOE_Y,DV_B,DA_B,PP_B,AU_B", "emp_979|생산기술센터|김임원|구매5팀|안지아|G2|TB_Y,DV_G,DA_G,PP_G", "emp_980|생산기술센터|김임원|구매5팀|황주원|G2|DOE_Y,PE_G,DV_G,AU_G", "emp_981|생산기술센터|김임원|구매5팀|강지우|G3|DV_SC,CL_Y,PP_GC,DS_Y,DOE_G,PE_G", "emp_982|생산기술센터|김임원|구매5팀|김지민|G3|TB_G,CL_GC,DA_G,PE_Y,DOE_Y,PP_Y", "emp_983|생산기술센터|김임원|구매5팀|송하윤|G3|AU_B,ML_GC,PP_G,DA_Y,CL_Y,DS_B", "emp_984|생산기술센터|김임원|구매5팀|윤수아|G3|DOE_SC,PP_Y,AU_G,PE_G,CL_G,ML_SC", "emp_985|생산기술센터|김임원|구매5팀|윤예은|G3|DS_Y,DOE_Y,PP_Y,DA_G", "emp_986|생산기술센터|김임원|구매5팀|장서현|G3|PP_G,DOE_G,DV_Y,PE_G,DS_Y,TB_GC", "emp_987|생산기술센터|서임원|전략2팀|박하윤|G1|CL_G,DV_Y,ML_G,DA_Y", "emp_988|생산기술센터|서임원|전략2팀|서시우|G1|AU_Y,DS_Y,DOE_Y,ML_G,PE_GC,PP_B", "emp_989|생산기술센터|서임원|전략2팀|이지민|G1|AU_Y,DV_GC,DA_Y,ML_G,PP_G,PE_G", "emp_990|생산기술센터|서임원|전략2팀|이채원|G1|ML_GC,DA_Y,PP_G,TB_GC,DS_Y,DOE_Y", "emp_991|생산기술센터|서임원|전략2팀|권지유|G2|DS_Y,ML_G,PE_G,PP_Y", "emp_992|생산기술센터|서임원|전략2팀|권하윤|G2|CL_SC,DS_B,PE_G,ML_G,DA_G,AU_Y", "emp_993|생산기술센터|서임원|전략2팀|송주원|G2|CL_Y,DS_SC,PE_SC,DV_G,DA_GC,ML_Y", "emp_994|생산기술센터|서임원|전략2팀|오윤서|G2|DOE_Y,TB_Y,DA_Y,ML_Y", "emp_995|생산기술센터|서임원|전략2팀|한도윤|G2|ML_G,DS_G,PE_Y,CL_Y", "emp_996|생산기술센터|서임원|전략2팀|한민준|G2|DV_Y,DOE_Y,CL_Y,ML_Y", "emp_997|생산기술센터|서임원|전략2팀|한서준|G2|DOE_Y,CL_Y,TB_G,DS_Y", "emp_998|생산기술센터|서임원|전략2팀|황주원|G2|TB_Y,DA_Y,CL_G,PP_Y", "emp_999|생산기술센터|서임원|전략2팀|이지우|G3|PP_Y,CL_G,PE_G,DOE_Y", "emp_1000|생산기술센터|서임원|전략2팀|전지우|G3|DOE_Y,DS_G,DA_Y,PE_Y", "emp_1001|생산기술센터|안임원|혁신4팀|권민서|G1|CL_Y,DS_Y,AU_G,DOE_G", "emp_1002|생산기술센터|안임원|혁신4팀|김예은|G1|PP_Y,DOE_G,CL_G,DV_G", "emp_1003|생산기술센터|안임원|혁신4팀|서주원|G1|PP_Y,DS_Y,DOE_G,CL_Y", "emp_1004|생산기술센터|안임원|혁신4팀|신서연|G1|DS_G,AU_Y,PE_Y,ML_Y", "emp_1005|생산기술센터|안임원|혁신4팀|윤채원|G1|AU_GC,DA_Y,DV_Y,CL_G,DOE_SC,PP_Y", "emp_1006|생산기술센터|안임원|혁신4팀|황예은|G1|TB_Y,DV_G,DOE_G,ML_Y", "emp_1007|생산기술센터|안임원|혁신4팀|권하은|G2|PE_SC,ML_G,CL_GC,DS_Y,DOE_GC,DV_GC,DA_B", "emp_1008|생산기술센터|안임원|혁신4팀|김도윤|G2|ML_G,DOE_G,PE_B,PP_SC,TB_G,DA_G", "emp_1009|생산기술센터|안임원|혁신4팀|임서연|G2|DA_Y,TB_G,DOE_Y,DS_G", "emp_1010|생산기술센터|안임원|혁신4팀|임예은|G2|DA_Y,PE_B,ML_Y,PP_Y,CL_G,DOE_G", "emp_1011|생산기술센터|안임원|혁신4팀|장서현|G2|DS_Y,PE_Y,CL_Y,DA_Y", "emp_1012|생산기술센터|안임원|혁신4팀|정도윤|G2|TB_G,PP_Y,CL_Y,DOE_G", "emp_1013|생산기술센터|안임원|혁신4팀|조예준|G2|TB_Y,DS_G,DOE_Y,PP_Y", "emp_1014|생산기술센터|안임원|혁신4팀|최윤서|G2|DS_Y,DA_Y,AU_Y,PE_Y", "emp_1015|생산기술센터|안임원|혁신4팀|한지훈|G2|AU_Y,DS_Y,TB_G,DA_Y", "emp_1016|생산기술센터|안임원|혁신4팀|권서연|G3|TB_SC,DV_Y,DA_Y,AU_G,PP_G,DOE_GC", "emp_1017|생산기술센터|안임원|혁신4팀|김서연|G3|CL_Y,DA_G,AU_Y,PE_G", "emp_1018|생산기술센터|안임원|혁신4팀|신민준|G3|PP_G,PE_Y,CL_Y,ML_Y", "emp_1019|생산기술센터|안임원|혁신4팀|전시우|G3|DV_G,ML_Y,DOE_Y,DA_G", "emp_1020|생산기술센터|안임원|혁신4팀|조예은|G3|CL_G,PP_Y,DOE_Y,PE_Y", "emp_1021|생산기술센터|이임원|기획5팀|박윤서|G1|CL_G,DV_Y,TB_G,DS_G", "emp_1022|생산기술센터|이임원|기획5팀|이하은|G1|PP_Y,DV_G,PE_G,ML_Y", "emp_1023|생산기술센터|이임원|기획5팀|임도윤|G1|PE_Y,TB_G,DOE_G,PP_G", "emp_1024|생산기술센터|이임원|기획5팀|장지우|G1|DV_G,CL_Y,TB_G,DA_G", "emp_1025|생산기술센터|이임원|기획5팀|홍지우|G1|PP_Y,AU_G,DA_Y,PE_Y", "emp_1026|생산기술센터|이임원|기획5팀|황하윤|G1|PP_B,DOE_G,DA_Y,PE_G,DV_G,CL_Y", "emp_1027|생산기술센터|이임원|기획5팀|신하준|G2|TB_Y,PE_GC,DOE_SC,CL_SC,DS_Y,ML_GC", "emp_1028|생산기술센터|이임원|기획5팀|안도윤|G2|DV_SC,DOE_Y,TB_G,PE_GC,DS_B,CL_G", "emp_1029|생산기술센터|이임원|기획5팀|임서준|G2|PP_Y,DS_Y,ML_Y,DOE_G", "emp_1030|생산기술센터|이임원|기획5팀|한시우|G2|PP_G,DV_GC,AU_Y,DS_Y,DA_B,CL_Y", "emp_1031|생산기술센터|이임원|기획5팀|안다은|G3|ML_G,AU_Y,DS_G,DA_G", "emp_1032|생산기술센터|이임원|기획5팀|안서현|G3|CL_GC,PP_GC,DV_B,DS_SC,PE_SC,DOE_SC,AU_G,TB_GC,DA_G,ML_GC", "emp_1033|생산기술센터|이임원|기획5팀|오주원|G3|PP_G,DA_G,DS_G,DV_G", "emp_1034|생산기술센터|이임원|기획5팀|오지훈|G3|CL_B,TB_G,DV_Y,DOE_G,PP_Y,PE_SC", "emp_1035|생산기술센터|이임원|기획5팀|이서윤|G3|PE_Y,DV_Y,TB_G,PP_Y", "emp_1036|생산기술센터|이임원|기획5팀|이지민|G3|DOE_G,TB_GC,CL_G,DS_GC,DA_SC,ML_B", "emp_1037|생산기술센터|이임원|기획5팀|임지아|G3|ML_Y,PP_Y,DA_G,TB_G", "emp_1038|생산기술센터|이임원|기획5팀|장준우|G3|PP_G,TB_G,PE_G,DA_Y", "emp_1039|생산기술센터|이임원|기획5팀|최도윤|G3|CL_Y,PP_Y,DOE_G,DA_Y", "emp_1040|생산기술센터|이임원|기획5팀|황서연|G3|DV_Y,PP_Y,TB_Y,CL_Y", "emp_1041|생산기술센터|임임원|혁신3팀|서예은|G1|TB_Y,PP_G,PE_G,DOE_Y", "emp_1042|생산기술센터|임임원|혁신3팀|윤주원|G1|DOE_G,PE_SC,DV_G,PP_Y,CL_G,DS_B", "emp_1043|생산기술센터|임임원|혁신3팀|장지호|G1|DA_G,PP_Y,DOE_Y,TB_Y", "emp_1044|생산기술센터|임임원|혁신3팀|최서현|G1|DV_Y,TB_Y,PE_Y,PP_Y", "emp_1045|생산기술센터|임임원|혁신3팀|최준우|G1|DOE_G,AU_Y,DS_Y,ML_G", "emp_1046|생산기술센터|임임원|혁신3팀|박윤서|G2|DS_SC,TB_G,PE_B,AU_SC,PP_GC,DOE_GC,DV_Y", "emp_1047|생산기술센터|임임원|혁신3팀|서지호|G2|AU_G,PE_G,DOE_G,DV_G", "emp_1048|생산기술센터|임임원|혁신3팀|신서윤|G2|PE_SC,AU_G,DS_G,TB_Y,DV_G,DA_Y", "emp_1049|생산기술센터|임임원|혁신3팀|신지훈|G2|DV_G,PP_Y,DA_G,TB_G", "emp_1050|생산기술센터|임임원|혁신3팀|전지우|G2|CL_G,AU_Y,PE_Y,DA_G", "emp_1051|생산기술센터|임임원|혁신3팀|황민준|G2|TB_G,DV_G,DA_G,ML_G", "emp_1052|생산기술센터|임임원|혁신3팀|강민준|G3|TB_B,AU_Y,DA_G,DV_GC,PE_G,DOE_GC", "emp_1053|생산기술센터|임임원|혁신3팀|권예은|G3|ML_Y,DOE_Y,TB_G,DA_Y", "emp_1054|생산기술센터|임임원|혁신3팀|박다은|G3|CL_Y,PE_Y,DA_G,ML_G", "emp_1055|생산기술센터|임임원|혁신3팀|송도윤|G3|DS_Y,PE_G,DOE_G,PP_Y", "emp_1056|생산기술센터|임임원|혁신3팀|오수아|G3|TB_G,PE_SC,DA_G,DV_B,PP_Y,AU_GC", "emp_1057|생산기술센터|임임원|혁신3팀|임주원|G3|ML_G,PE_G,CL_Y,TB_Y", "emp_1058|생산기술센터|임임원|혁신3팀|전지훈|G3|AU_Y,ML_Y,DOE_Y,DA_Y", "emp_1059|생산기술센터|최임원|기술6팀|권지우|G1|DS_Y,PE_G,DA_Y,TB_Y", "emp_1060|생산기술센터|최임원|기술6팀|전서현|G1|ML_G,DOE_G,DV_G,TB_G,AU_Y,CL_G", "emp_1061|생산기술센터|최임원|기술6팀|정하윤|G1|DS_GC,DV_B,ML_B,AU_GC,PP_GC,DOE_SC,CL_B,TB_B,PE_B", "emp_1062|생산기술센터|최임원|기술6팀|황예은|G1|DS_Y,DOE_Y,CL_Y,TB_G", "emp_1063|생산기술센터|최임원|기술6팀|김예준|G2|DA_Y,AU_Y,DV_G,PE_Y", "emp_1064|생산기술센터|최임원|기술6팀|김지우|G2|PP_G,TB_Y,DOE_G,AU_Y", "emp_1065|생산기술센터|최임원|기술6팀|오하은|G2|DS_B,DA_Y,AU_Y,TB_GC,PE_G,ML_SC", "emp_1066|생산기술센터|최임원|기술6팀|윤서윤|G2|PP_Y,DV_Y,CL_Y,DA_G", "emp_1067|생산기술센터|최임원|기술6팀|윤주원|G2|DA_G,ML_G,DS_Y,PE_Y", "emp_1068|생산기술센터|최임원|기술6팀|장주원|G2|DS_SC,CL_GC,DA_G,PP_B,PE_Y,AU_Y", "emp_1069|생산기술센터|최임원|기술6팀|정서연|G2|PE_Y,ML_Y,DS_Y,AU_G", "emp_1070|생산기술센터|최임원|기술6팀|조지아|G2|PP_G,DS_Y,ML_Y,TB_Y", "emp_1071|생산기술센터|최임원|기술6팀|홍하윤|G2|PE_B,DA_GC,DS_B,AU_Y,CL_B,DV_B", "emp_1072|생산기술센터|최임원|기술6팀|김서준|G3|AU_GC,PE_SC,DA_GC,PP_SC,DOE_SC,DV_GC,TB_G,CL_SC,ML_G", "emp_1073|생산기술센터|최임원|기술6팀|송민서|G3|TB_Y,AU_Y,DA_Y,DOE_Y", "emp_1074|생산기술센터|최임원|기술6팀|오민준|G3|CL_G,DA_Y,AU_Y,DOE_GC,ML_GC,PP_GC,PE_G,DV_G,TB_GC,DS_GC", "emp_1075|생산기술센터|최임원|기술6팀|이수아|G3|TB_Y,DV_G,DA_G,CL_Y", "emp_1076|생산기술센터|최임원|기술6팀|최윤서|G3|DS_G,DV_G,DOE_SC,PP_GC,DA_B,CL_B,AU_B,ML_SC,TB_B,PE_GC", "emp_1077|생산기술센터|최임원|기술6팀|한지유|G3|DS_G,PP_GC,TB_G,AU_Y,ML_B,DOE_G", "emp_1078|석유화학사업본부|김임원|생산4팀|김서준|G1|DV_Y,DOE_G,TB_Y,PP_Y", "emp_1079|석유화학사업본부|김임원|생산4팀|윤민서|G1|DV_Y,AU_G,PP_Y,DA_Y", "emp_1080|석유화학사업본부|김임원|생산4팀|장주원|G1|DA_Y,AU_Y,ML_Y,TB_G", "emp_1081|석유화학사업본부|김임원|생산4팀|정서연|G1|DOE_SC,DS_B,ML_G,TB_G,DV_G,AU_GC,DA_Y,PE_SC", "emp_1082|석유화학사업본부|김임원|생산4팀|황하은|G1|PE_Y,DS_G,DV_Y,ML_G", "emp_1083|석유화학사업본부|김임원|생산4팀|강서윤|G2|DA_Y,AU_G,ML_Y,TB_Y", "emp_1084|석유화학사업본부|김임원|생산4팀|권민준|G2|AU_Y,PE_G,TB_G,DOE_Y", "emp_1085|석유화학사업본부|김임원|생산4팀|권주원|G2|DA_G,CL_G,PE_SC,TB_G,PP_Y,DV_Y", "emp_1086|석유화학사업본부|김임원|생산4팀|김서윤|G2|DS_Y,DOE_Y,DV_Y,ML_Y", "emp_1087|석유화학사업본부|김임원|생산4팀|안주원|G2|ML_B,DA_GC,DV_Y,PE_Y,PP_SC,DS_Y", "emp_1088|석유화학사업본부|김임원|생산4팀|조지유|G2|PE_G,ML_Y,DS_Y,AU_Y", "emp_1089|석유화학사업본부|김임원|생산4팀|홍지유|G2|DOE_Y,DS_Y,CL_G,TB_G", "emp_1090|석유화학사업본부|김임원|생산4팀|서서윤|G3|ML_Y,DS_Y,TB_G,PE_Y", "emp_1091|석유화학사업본부|김임원|생산4팀|서하윤|G3|PP_Y,DS_Y,CL_G,ML_Y", "emp_1092|석유화학사업본부|김임원|생산4팀|안시우|G3|TB_Y,CL_Y,PE_G,DOE_G", "emp_1093|석유화학사업본부|김임원|생산4팀|장윤서|G3|TB_B,DS_B,PP_Y,DV_Y,ML_SC,CL_Y", "emp_1094|석유화학사업본부|김임원|생산4팀|장준우|G3|TB_G,CL_Y,PE_Y,PP_G", "emp_1095|석유화학사업본부|김임원|생산4팀|정하은|G3|DOE_Y,DA_GC,TB_Y,ML_SC,AU_SC,DV_B", "emp_1096|석유화학사업본부|김임원|생산4팀|홍지유|G3|PE_Y,DS_Y,DOE_Y,CL_G", "emp_1097|석유화학사업본부|박임원|지원4팀|강다은|G1|PP_G,AU_Y,CL_G,DA_GC,DV_Y,TB_G", "emp_1098|석유화학사업본부|박임원|지원4팀|강지호|G1|PE_Y,DOE_Y,DA_Y,DV_G", "emp_1099|석유화학사업본부|박임원|지원4팀|김하준|G1|PP_B,DV_GC,DOE_GC,CL_GC,TB_GC,ML_GC,DS_GC,DA_GC,AU_GC,PE_Y", "emp_1100|석유화학사업본부|박임원|지원4팀|안하윤|G1|CL_G,AU_G,DV_G,PE_Y", "emp_1101|석유화학사업본부|박임원|지원4팀|윤수빈|G1|DS_G,DV_G,PE_Y,DOE_B,AU_B,TB_G", "emp_1102|석유화학사업본부|박임원|지원4팀|이예준|G1|DA_SC,CL_B,DOE_G,DV_B,PE_SC,PP_G", "emp_1103|석유화학사업본부|박임원|지원4팀|정서연|G1|PP_Y,CL_Y,TB_Y,DV_Y", "emp_1104|석유화학사업본부|박임원|지원4팀|김채원|G2|CL_G,PE_Y,DOE_Y,DV_G", "emp_1105|석유화학사업본부|박임원|지원4팀|서지호|G2|DS_Y,TB_G,DOE_G,AU_G", "emp_1106|석유화학사업본부|박임원|지원4팀|안민서|G2|PP_G,PE_G,ML_Y,DV_G", "emp_1107|석유화학사업본부|박임원|지원4팀|정지훈|G2|DOE_Y,DA_GC,PP_Y,DV_G,PE_G,TB_G", "emp_1108|석유화학사업본부|박임원|지원4팀|오주원|G3|TB_G,AU_G,PP_G,DA_Y", "emp_1109|석유화학사업본부|박임원|지원4팀|이서현|G3|DA_Y,ML_Y,PP_Y,PE_Y", "emp_1110|석유화학사업본부|박임원|지원4팀|전수빈|G3|CL_Y,DS_G,AU_G,DOE_Y", "emp_1111|석유화학사업본부|박임원|지원4팀|조하준|G3|DA_Y,ML_G,AU_Y,PP_Y", "emp_1112|석유화학사업본부|박임원|지원4팀|황예은|G3|TB_Y,DOE_G,PE_G,AU_G", "emp_1113|석유화학사업본부|오임원|관리7팀|강지훈|G1|DS_B,TB_GC,AU_G,PE_G,DOE_G,PP_G", "emp_1114|석유화학사업본부|오임원|관리7팀|서서윤|G1|TB_Y,ML_G,AU_G,CL_Y", "emp_1115|석유화학사업본부|오임원|관리7팀|송수빈|G1|PP_B,CL_Y,ML_GC,DV_Y,DS_Y,TB_B", "emp_1116|석유화학사업본부|오임원|관리7팀|윤윤서|G1|DOE_Y,DA_G,DS_G,CL_B,ML_G,PP_G", "emp_1117|석유화학사업본부|오임원|관리7팀|임도윤|G1|DS_B,PP_G,TB_GC,ML_Y,AU_Y,PE_Y", "emp_1118|석유화학사업본부|오임원|관리7팀|정주원|G1|CL_G,ML_Y,TB_G,PE_G", "emp_1119|석유화학사업본부|오임원|관리7팀|최서준|G1|ML_Y,DOE_G,DS_SC,DA_GC,CL_Y,AU_Y", "emp_1120|석유화학사업본부|오임원|관리7팀|한지호|G1|DS_GC,DA_SC,TB_G,AU_Y,PP_SC,CL_Y,DOE_GC,PE_G,DV_B,ML_B", "emp_1121|석유화학사업본부|오임원|관리7팀|권서현|G2|DV_SC,CL_Y,TB_Y,PE_GC,DA_GC,ML_SC,DS_G,DOE_SC,PP_GC", "emp_1122|석유화학사업본부|오임원|관리7팀|김민서|G2|ML_G,CL_GC,DS_SC,DA_B,DOE_GC,PE_Y", "emp_1123|석유화학사업본부|오임원|관리7팀|송민서|G2|DV_G,ML_Y,TB_G,DA_Y", "emp_1124|석유화학사업본부|오임원|관리7팀|오서현|G2|DV_Y,CL_Y,TB_G,DA_Y", "emp_1125|석유화학사업본부|오임원|관리7팀|오지우|G2|DS_Y,DOE_G,TB_Y,DV_G", "emp_1126|석유화학사업본부|오임원|관리7팀|장지훈|G2|TB_G,DV_Y,PP_Y,DA_Y", "emp_1127|석유화학사업본부|오임원|관리7팀|전윤서|G2|ML_Y,AU_Y,DV_Y,CL_Y", "emp_1128|석유화학사업본부|오임원|관리7팀|송지민|G3|DV_Y,PE_G,DOE_Y,DA_G", "emp_1129|석유화학사업본부|오임원|관리7팀|안서윤|G3|TB_G,DS_Y,CL_Y,PE_Y", "emp_1130|석유화학사업본부|오임원|관리7팀|안채원|G3|PP_Y,DV_G,ML_G,AU_G", "emp_1131|석유화학사업본부|오임원|관리7팀|홍지민|G3|PP_G,AU_Y,PE_G,DV_Y", "emp_1132|석유화학사업본부|오임원|관리7팀|홍하준|G3|AU_Y,DS_GC,DOE_G,CL_Y,PP_G,PE_G", "emp_1133|석유화학사업본부|장임원|회계5팀|김예준|G1|PP_Y,TB_G,DV_Y,PE_Y", "emp_1134|석유화학사업본부|장임원|회계5팀|김채원|G1|CL_Y,DA_Y,PE_Y,DS_G", "emp_1135|석유화학사업본부|장임원|회계5팀|박하윤|G1|DS_Y,ML_GC,AU_Y,TB_Y,CL_G,DV_Y", "emp_1136|석유화학사업본부|장임원|회계5팀|신민준|G1|DA_Y,CL_G,DV_G,ML_G", "emp_1137|석유화학사업본부|장임원|회계5팀|윤서현|G1|PP_Y,TB_Y,PE_Y,DS_Y", "emp_1138|석유화학사업본부|장임원|회계5팀|임하준|G1|ML_Y,DS_Y,PP_G,DOE_G", "emp_1139|석유화학사업본부|장임원|회계5팀|김수아|G2|DS_Y,DA_Y,TB_G,CL_G", "emp_1140|석유화학사업본부|장임원|회계5팀|김하은|G2|CL_G,AU_Y,TB_Y,PE_G", "emp_1141|석유화학사업본부|장임원|회계5팀|박도윤|G2|TB_Y,PP_Y,PE_Y,ML_G", "emp_1142|석유화학사업본부|장임원|회계5팀|박서현|G2|PE_Y,DV_B,AU_G,DS_Y,PP_Y,TB_B", "emp_1143|석유화학사업본부|장임원|회계5팀|서하은|G2|DV_GC,ML_G,DA_G,CL_Y,PE_GC,DS_SC,PP_B,TB_GC", "emp_1144|석유화학사업본부|장임원|회계5팀|이민서|G2|CL_SC,AU_Y,DOE_G,DS_GC,PP_G,ML_G", "emp_1145|석유화학사업본부|장임원|회계5팀|임서연|G2|CL_G,AU_Y,DV_G,ML_Y", "emp_1146|석유화학사업본부|장임원|회계5팀|정하윤|G2|ML_GC,DA_Y,DOE_GC,PE_B,TB_GC,DS_GC,AU_B,PP_SC", "emp_1147|석유화학사업본부|장임원|회계5팀|정하준|G2|DS_G,DOE_Y,PP_Y,DV_Y", "emp_1148|석유화학사업본부|장임원|회계5팀|안지아|G3|TB_Y,PE_G,DOE_G,ML_G", "emp_1149|석유화학사업본부|장임원|회계5팀|오수아|G3|CL_Y,PP_Y,DA_Y,ML_G", "emp_1150|석유화학사업본부|장임원|회계5팀|최지훈|G3|PE_Y,PP_G,DOE_Y,DS_Y", "emp_1151|석유화학사업본부|장임원|회계5팀|황지아|G3|PP_G,PE_Y,TB_G,DOE_G", "emp_1152|석유화학사업본부|장임원|회계5팀|황지우|G3|CL_Y,AU_G,PE_G,ML_G,DS_Y,PP_G", "emp_1153|석유화학사업본부|정임원|기술7팀|서하준|G1|DV_Y,CL_Y,AU_G,DA_Y", "emp_1154|석유화학사업본부|정임원|기술7팀|임하은|G1|DA_Y,DS_Y,TB_SC,AU_G,PE_G,PP_SC", "emp_1155|석유화학사업본부|정임원|기술7팀|정예은|G1|PP_Y,DS_Y,TB_Y,DA_Y", "emp_1156|석유화학사업본부|정임원|기술7팀|강지아|G2|ML_Y,AU_G,CL_G,DV_Y", "emp_1157|석유화학사업본부|정임원|기술7팀|신도윤|G2|PE_G,DS_G,AU_Y,DOE_Y", "emp_1158|석유화학사업본부|정임원|기술7팀|신민준|G2|TB_Y,DA_G,PP_Y,DV_Y", "emp_1159|석유화학사업본부|정임원|기술7팀|안채원|G2|AU_G,TB_G,DS_Y,DV_Y", "emp_1160|석유화학사업본부|정임원|기술7팀|최윤서|G2|DV_G,DA_G,ML_Y,CL_Y", "emp_1161|석유화학사업본부|정임원|기술7팀|홍지훈|G2|DOE_Y,PP_Y,PE_G,CL_SC,TB_GC,ML_SC,DA_GC", "emp_1162|석유화학사업본부|정임원|기술7팀|박지훈|G3|DOE_GC,AU_GC,TB_G,DV_B,ML_B,PE_G,PP_SC,DA_Y,DS_GC,CL_Y", "emp_1163|석유화학사업본부|정임원|기술7팀|장예은|G3|PP_G,DV_GC,TB_SC,PE_SC,AU_G,DOE_GC,CL_GC,ML_SC,DS_SC", "emp_1164|석유화학사업본부|정임원|기술7팀|최지호|G3|CL_Y,AU_Y,TB_Y,DS_G", "emp_1165|석유화학사업본부|홍임원|AX2팀|박도윤|G1|DV_Y,DOE_G,PE_G,DA_G", "emp_1166|석유화학사업본부|홍임원|AX2팀|송지우|G1|DS_GC,DOE_B,PE_Y,TB_Y,AU_Y,DA_G", "emp_1167|석유화학사업본부|홍임원|AX2팀|송하준|G1|AU_G,PP_Y,PE_Y,TB_G", "emp_1168|석유화학사업본부|홍임원|AX2팀|신준우|G1|DS_G,DV_GC,ML_Y,DA_SC,TB_GC,CL_G", "emp_1169|석유화학사업본부|홍임원|AX2팀|정지민|G1|PP_GC,ML_SC,AU_B,CL_Y,DV_GC,TB_GC,DA_GC,DS_Y,DOE_SC", "emp_1170|석유화학사업본부|홍임원|AX2팀|조지우|G1|ML_B,DV_GC,PE_B,AU_G,DA_G,PP_SC,DOE_GC,CL_SC", "emp_1171|석유화학사업본부|홍임원|AX2팀|조지호|G1|PE_G,DS_Y,DA_SC,DOE_G,PP_Y,AU_G", "emp_1172|석유화학사업본부|홍임원|AX2팀|한서윤|G1|PE_Y,DOE_G,DV_Y,ML_G", "emp_1173|석유화학사업본부|홍임원|AX2팀|김하준|G2|CL_B,ML_G,DA_SC,TB_Y,DOE_SC,PP_G", "emp_1174|석유화학사업본부|홍임원|AX2팀|서수빈|G2|DV_G,TB_SC,DOE_Y,PE_Y,PP_G,ML_SC", "emp_1175|석유화학사업본부|홍임원|AX2팀|임하윤|G2|PE_G,ML_Y,DS_Y,DOE_Y", "emp_1176|석유화학사업본부|홍임원|AX2팀|장서연|G2|DA_G,PP_G,ML_Y,TB_Y", "emp_1177|석유화학사업본부|홍임원|AX2팀|장윤서|G2|CL_G,ML_G,TB_B,PP_Y,PE_Y,DV_G", "emp_1178|석유화학사업본부|홍임원|AX2팀|조하준|G2|AU_GC,DA_G,CL_G,DV_B,ML_Y,DS_SC", "emp_1179|석유화학사업본부|홍임원|AX2팀|한채원|G2|ML_G,DOE_Y,DA_Y,DV_G", "emp_1180|석유화학사업본부|홍임원|AX2팀|김예은|G3|DA_G,DV_Y,TB_G,DS_G", "emp_1181|석유화학사업본부|홍임원|AX2팀|오지민|G3|PE_Y,DS_Y,CL_Y,PP_G", "emp_1182|석유화학사업본부|홍임원|AX2팀|오지호|G3|DS_Y,PP_G,TB_G,CL_G", "emp_1183|석유화학사업본부|홍임원|AX2팀|최지훈|G3|PE_G,DOE_B,ML_G,DA_Y,TB_B,CL_Y", "emp_1184|석유화학사업본부|홍임원|AX2팀|홍하은|G3|PP_GC,PE_G,DV_B,ML_G,TB_GC,DOE_GC", "emp_1185|석유화학사업본부|황임원|회계4팀|안지우|G1|PP_G,DS_Y,AU_G,CL_Y", "emp_1186|석유화학사업본부|황임원|회계4팀|정지호|G1|DS_G,DV_Y,AU_G,CL_G", "emp_1187|석유화학사업본부|황임원|회계4팀|조지훈|G1|DA_SC,DS_B,PP_G,AU_Y,DOE_G,DV_GC", "emp_1188|석유화학사업본부|황임원|회계4팀|권서윤|G2|CL_B,PE_GC,DOE_G,ML_B,DS_GC,DV_B", "emp_1189|석유화학사업본부|황임원|회계4팀|김도윤|G2|PE_GC,DOE_GC,ML_B,DV_GC,DS_Y,DA_SC,AU_SC,TB_GC,PP_GC,CL_GC", "emp_1190|석유화학사업본부|황임원|회계4팀|박하준|G2|DS_G,CL_Y,PE_Y,DA_Y", "emp_1191|석유화학사업본부|황임원|회계4팀|오지호|G2|CL_SC,DV_Y,TB_Y,DS_G,PE_G,PP_B", "emp_1192|석유화학사업본부|황임원|회계4팀|최서윤|G2|AU_SC,PE_B,ML_SC,DS_Y,DOE_G,TB_G", "emp_1193|석유화학사업본부|황임원|회계4팀|최지호|G2|PE_Y,AU_G,DA_G,DV_SC,TB_Y,PP_SC", "emp_1194|석유화학사업본부|황임원|회계4팀|홍다은|G2|PP_B,TB_GC,CL_G,ML_Y,DA_G,DOE_G", "emp_1195|석유화학사업본부|황임원|회계4팀|홍지호|G2|AU_Y,PE_Y,CL_Y,DV_Y", "emp_1196|석유화학사업본부|황임원|회계4팀|송다은|G3|PP_Y,AU_G,DA_Y,TB_Y", "emp_1197|석유화학사업본부|황임원|회계4팀|안지유|G3|ML_Y,DA_G,DV_Y,PP_G", "emp_1198|석유화학사업본부|황임원|회계4팀|이하준|G3|DV_Y,PP_Y,TB_Y,ML_Y", "emp_1199|석유화학사업본부|황임원|회계4팀|최시우|G3|DOE_Y,CL_G,PP_G,TB_Y", "emp_1200|석유화학사업본부|황임원|회계4팀|황서윤|G3|DV_G,PP_G,PE_Y,DS_Y", "emp_1201|인사지원센터|권임원|구매7팀|신수아|G1|DS_SC,ML_G,PP_G,TB_Y,DA_G,AU_G", "emp_1202|인사지원센터|권임원|구매7팀|신윤서|G1|CL_Y,DOE_Y,DA_Y,AU_G", "emp_1203|인사지원센터|권임원|구매7팀|안예은|G1|AU_Y,PE_G,DS_G,ML_Y", "emp_1204|인사지원센터|권임원|구매7팀|윤지우|G1|DA_GC,DOE_G,ML_GC,AU_G,PE_G,PP_SC,TB_GC,DV_B,DS_GC", "emp_1205|인사지원센터|권임원|구매7팀|전채원|G1|DS_Y,DV_G,PE_G,DOE_Y", "emp_1206|인사지원센터|권임원|구매7팀|최하은|G1|DV_B,DS_SC,PP_Y,DOE_G,DA_G,TB_G,AU_SC", "emp_1207|인사지원센터|권임원|구매7팀|강하윤|G2|ML_Y,AU_Y,DOE_Y,DV_Y", "emp_1208|인사지원센터|권임원|구매7팀|권지호|G2|TB_Y,DOE_B,DV_Y,DA_SC,ML_GC,PP_SC,CL_Y,AU_SC", "emp_1209|인사지원센터|권임원|구매7팀|서하은|G2|DA_GC,DV_G,CL_SC,DOE_GC,TB_SC,PP_GC,DS_Y,ML_SC,PE_Y", "emp_1210|인사지원센터|권임원|구매7팀|신하준|G2|TB_B,CL_Y,DS_GC,DV_GC,ML_SC,DA_SC", "emp_1211|인사지원센터|권임원|구매7팀|오준우|G2|PP_Y,DA_Y,DS_Y,DOE_G", "emp_1212|인사지원센터|권임원|구매7팀|오지민|G2|DA_G,DOE_G,DV_G,TB_G", "emp_1213|인사지원센터|권임원|구매7팀|윤채원|G2|CL_Y,PE_G,DOE_G,ML_Y", "emp_1214|인사지원센터|권임원|구매7팀|임다은|G2|TB_Y,DA_G,PE_Y,CL_G", "emp_1215|인사지원센터|권임원|구매7팀|최서준|G2|AU_SC,DS_SC,DV_G,DOE_Y,CL_B,PP_Y", "emp_1216|인사지원센터|권임원|구매7팀|김지훈|G3|TB_G,DV_Y,PE_G,DA_G", "emp_1217|인사지원센터|권임원|구매7팀|신지민|G3|PE_Y,PP_B,DV_SC,DOE_GC,DS_G,CL_SC", "emp_1218|인사지원센터|권임원|구매7팀|안서연|G3|PP_Y,PE_G,DOE_G,DA_Y,DS_G,TB_G", "emp_1219|인사지원센터|권임원|구매7팀|안주원|G3|CL_G,DA_B,DOE_SC,PE_G,ML_G,DV_GC,AU_GC", "emp_1220|인사지원센터|권임원|구매7팀|홍지아|G3|DS_G,CL_G,DV_GC,AU_B,PP_G,TB_G", "emp_1221|인사지원센터|송임원|인사7팀|윤시우|G1|DA_Y,PE_G,DS_G,TB_Y", "emp_1222|인사지원센터|송임원|인사7팀|조민준|G1|DV_G,PE_Y,AU_Y,ML_Y", "emp_1223|인사지원센터|송임원|인사7팀|홍다은|G1|DOE_Y,ML_G,CL_Y,DV_G", "emp_1224|인사지원센터|송임원|인사7팀|박도윤|G2|ML_Y,AU_G,DS_G,PE_Y", "emp_1225|인사지원센터|송임원|인사7팀|서도윤|G2|CL_G,TB_Y,DV_G,PE_G", "emp_1226|인사지원센터|송임원|인사7팀|정예은|G2|CL_G,DOE_GC,PE_GC,AU_Y,TB_B,PP_B", "emp_1227|인사지원센터|송임원|인사7팀|한채원|G2|CL_Y,ML_Y,DOE_G,TB_G", "emp_1228|인사지원센터|송임원|인사7팀|권수빈|G3|PP_Y,DOE_Y,ML_Y,DS_Y", "emp_1229|인사지원센터|송임원|인사7팀|신수아|G3|DOE_Y,AU_G,PP_G,DA_G", "emp_1230|인사지원센터|송임원|인사7팀|안다은|G3|PE_Y,DV_G,AU_Y,TB_Y", "emp_1231|인사지원센터|송임원|인사7팀|안지유|G3|TB_Y,ML_G,PP_G,DS_Y", "emp_1232|인사지원센터|송임원|인사7팀|윤도윤|G3|DA_G,AU_SC,CL_B,PE_Y,DV_B,DS_GC,DOE_Y,ML_SC,TB_G,PP_B", "emp_1233|인사지원센터|송임원|인사7팀|이주원|G3|TB_G,DV_G,PP_Y,CL_G", "emp_1234|인사지원센터|송임원|인사7팀|임예준|G3|DOE_Y,ML_Y,CL_Y,AU_Y", "emp_1235|인사지원센터|송임원|인사7팀|황서현|G3|ML_B,TB_SC,PE_G,PP_SC,AU_GC,DV_B,DS_SC", "emp_1236|인사지원센터|이임원|연구팀|강지아|G1|CL_Y,DA_Y,ML_Y,PP_G", "emp_1237|인사지원센터|이임원|연구팀|오민서|G1|DA_G,DS_Y,CL_Y,TB_Y", "emp_1238|인사지원센터|이임원|연구팀|오서연|G1|AU_G,ML_G,PE_G,CL_G", "emp_1239|인사지원센터|이임원|연구팀|오수빈|G1|DOE_G,DA_Y,DS_SC,TB_GC,PP_SC,DV_GC,PE_GC,ML_GC,AU_B,CL_B", "emp_1240|인사지원센터|이임원|연구팀|윤윤서|G1|PE_Y,AU_Y,DS_G,DOE_Y", "emp_1241|인사지원센터|이임원|연구팀|윤하윤|G1|AU_Y,ML_G,DV_Y,TB_G", "emp_1242|인사지원센터|이임원|연구팀|장하윤|G1|DV_Y,DA_Y,DS_G,CL_Y", "emp_1243|인사지원센터|이임원|연구팀|권서준|G2|PE_G,DS_Y,DV_Y,DOE_G", "emp_1244|인사지원센터|이임원|연구팀|박수아|G2|DS_G,PP_Y,AU_Y,TB_Y", "emp_1245|인사지원센터|이임원|연구팀|서도윤|G2|TB_SC,PE_G,PP_GC,DOE_SC,CL_Y,DA_Y,ML_GC,DS_SC", "emp_1246|인사지원센터|이임원|연구팀|서하윤|G2|DA_Y,CL_Y,TB_G,PE_Y", "emp_1247|인사지원센터|이임원|연구팀|신하윤|G2|PE_Y,DA_Y,TB_Y,CL_G", "emp_1248|인사지원센터|이임원|연구팀|한시우|G2|DOE_G,DS_Y,DA_Y,TB_G", "emp_1249|인사지원센터|이임원|연구팀|홍도윤|G2|PE_Y,CL_G,PP_G,DV_Y", "emp_1250|인사지원센터|이임원|연구팀|강예준|G3|PP_GC,DV_SC,AU_GC,CL_SC,DS_Y,DOE_G,PE_G,DA_GC,ML_B", "emp_1251|인사지원센터|이임원|연구팀|서예은|G3|PP_Y,CL_Y,AU_G,ML_Y", "emp_1252|인사지원센터|이임원|연구팀|서하준|G3|PE_B,DS_Y,TB_G,CL_G,ML_GC,DA_GC", "emp_1253|인사지원센터|이임원|연구팀|신수빈|G3|PP_Y,DOE_Y,DS_G,AU_G", "emp_1254|인사지원센터|이임원|연구팀|안윤서|G3|DOE_Y,DA_Y,AU_G,DV_G", "emp_1255|인사지원센터|이임원|연구팀|장준우|G3|PP_Y,TB_Y,PE_G,DV_Y", "emp_1256|인사지원센터|조임원|혁신팀|강주원|G1|DV_SC,ML_GC,AU_Y,TB_G,PE_Y,DOE_Y", "emp_1257|인사지원센터|조임원|혁신팀|권지민|G1|DS_B,DOE_GC,AU_G,DA_G,DV_Y,PE_Y", "emp_1258|인사지원센터|조임원|혁신팀|박하준|G1|PP_G,CL_Y,DA_Y,DOE_Y", "emp_1259|인사지원센터|조임원|혁신팀|오수아|G1|DS_Y,ML_G,CL_G,PP_GC,DOE_GC,AU_Y", "emp_1260|인사지원센터|조임원|혁신팀|임다은|G1|PE_Y,TB_B,ML_GC,PP_Y,DOE_B,DS_G", "emp_1261|인사지원센터|조임원|혁신팀|임하준|G1|TB_Y,DV_Y,PE_Y,DS_Y", "emp_1262|인사지원센터|조임원|혁신팀|정서준|G1|CL_Y,DA_G,DV_Y,PP_Y", "emp_1263|인사지원센터|조임원|혁신팀|한서윤|G1|DA_Y,ML_Y,PE_Y,PP_G", "emp_1264|인사지원센터|조임원|혁신팀|한예준|G1|CL_G,DA_G,DV_G,PP_Y", "emp_1265|인사지원센터|조임원|혁신팀|홍서연|G1|AU_Y,CL_G,PP_G,DA_Y", "emp_1266|인사지원센터|조임원|혁신팀|강지민|G2|DOE_G,DV_G,DS_B,PE_Y,ML_B,CL_Y", "emp_1267|인사지원센터|조임원|혁신팀|서지아|G2|TB_G,AU_G,DOE_G,ML_Y", "emp_1268|인사지원센터|조임원|혁신팀|신준우|G2|AU_G,ML_G,DS_G,TB_Y", "emp_1269|인사지원센터|조임원|혁신팀|전서현|G2|TB_Y,DOE_Y,ML_G,AU_G", "emp_1270|인사지원센터|조임원|혁신팀|조민준|G2|TB_Y,ML_Y,DS_Y,CL_G,AU_Y,PE_B", "emp_1271|인사지원센터|조임원|혁신팀|조윤서|G2|PP_Y,DOE_SC,PE_SC,TB_Y,DS_GC,AU_Y,DV_B,CL_G,DA_GC", "emp_1272|인사지원센터|조임원|혁신팀|홍지아|G2|ML_G,DOE_Y,PE_G,DV_Y", "emp_1273|인사지원센터|조임원|혁신팀|김주원|G3|CL_Y,DOE_Y,TB_G,PP_Y", "emp_1274|인사지원센터|조임원|혁신팀|윤서준|G3|TB_Y,DA_Y,DV_G,PE_Y", "emp_1275|인사지원센터|조임원|혁신팀|황지아|G3|DOE_Y,TB_Y,DV_Y,CL_Y", "emp_1276|인사지원센터|최임원|인사5팀|임서현|G1|PE_G,PP_Y,CL_Y,ML_G", "emp_1277|인사지원센터|최임원|인사5팀|장주원|G1|DV_GC,AU_SC,DA_Y,PE_GC,PP_B,CL_G", "emp_1278|인사지원센터|최임원|인사5팀|홍지아|G1|DOE_SC,AU_Y,CL_G,ML_G,TB_SC,DS_GC", "emp_1279|인사지원센터|최임원|인사5팀|황채원|G1|TB_Y,DV_Y,CL_G,ML_Y", "emp_1280|인사지원센터|최임원|인사5팀|권도윤|G2|DV_Y,ML_Y,DS_G,CL_Y", "emp_1281|인사지원센터|최임원|인사5팀|권서현|G2|ML_G,DOE_G,CL_Y,AU_G", "emp_1282|인사지원센터|최임원|인사5팀|신하윤|G2|DOE_Y,DA_G,PE_G,PP_Y", "emp_1283|인사지원센터|최임원|인사5팀|이하윤|G2|CL_G,DA_G,ML_Y,PE_Y,DS_G,DOE_B", "emp_1284|인사지원센터|최임원|인사5팀|장서준|G2|DV_G,DS_Y,PE_G,DA_Y", "emp_1285|인사지원센터|최임원|인사5팀|최서윤|G2|PE_G,DOE_G,CL_G,ML_Y", "emp_1286|인사지원센터|최임원|인사5팀|최윤서|G2|CL_Y,DV_G,DS_G,ML_Y", "emp_1287|인사지원센터|최임원|인사5팀|황지호|G2|DA_Y,DOE_Y,PE_Y,TB_G", "emp_1288|인사지원센터|최임원|인사5팀|박지호|G3|DA_Y,DOE_G,DV_G,PP_Y", "emp_1289|인사지원센터|최임원|인사5팀|박하준|G3|DA_G,DOE_G,CL_G,ML_Y", "emp_1290|인사지원센터|최임원|인사5팀|서주원|G3|DOE_G,CL_Y,DS_G,DV_G", "emp_1291|인사지원센터|최임원|인사5팀|서주원|G3|PE_Y,DS_G,PP_G,DV_Y", "emp_1292|인사지원센터|최임원|인사5팀|오지민|G3|ML_G,DOE_G,AU_Y,PE_Y", "emp_1293|인사지원센터|최임원|인사5팀|장하윤|G3|PP_Y,TB_G,PE_G,DV_G", "emp_1294|인사지원센터|최임원|인사5팀|최예은|G3|AU_Y,PP_Y,TB_G,DV_G", "emp_1295|인사지원센터|최임원|인사5팀|최하준|G3|DV_Y,CL_G,AU_Y,DS_Y", "emp_1296|인사지원센터|한임원|품질6팀|권도윤|G1|ML_Y,DV_Y,AU_Y,TB_Y", "emp_1297|인사지원센터|한임원|품질6팀|윤윤서|G1|ML_GC,PE_GC,DV_B,DOE_GC,PP_SC,DA_SC,AU_GC,TB_SC", "emp_1298|인사지원센터|한임원|품질6팀|전민서|G1|AU_B,TB_G,CL_Y,PP_Y,DV_GC,DS_B", "emp_1299|인사지원센터|한임원|품질6팀|송하은|G2|AU_B,PE_B,CL_G,DOE_GC,DS_GC,DA_Y,TB_GC,DV_SC,PP_B,ML_G", "emp_1300|인사지원센터|한임원|품질6팀|신윤서|G2|DV_GC,PE_GC,CL_B,PP_Y,AU_G,DOE_GC", "emp_1301|인사지원센터|한임원|품질6팀|신윤서|G2|ML_G,PE_Y,PP_Y,DV_Y", "emp_1302|인사지원센터|한임원|품질6팀|이지우|G2|PP_G,AU_G,PE_G,CL_Y", "emp_1303|인사지원센터|한임원|품질6팀|장수빈|G2|AU_G,DOE_Y,TB_Y,DS_Y", "emp_1304|인사지원센터|한임원|품질6팀|전지아|G2|PP_G,DOE_Y,TB_Y,PE_G", "emp_1305|인사지원센터|한임원|품질6팀|조채원|G2|AU_Y,CL_G,PP_Y,DA_G", "emp_1306|인사지원센터|한임원|품질6팀|권서윤|G3|DA_G,AU_G,CL_G,PE_Y", "emp_1307|인사지원센터|한임원|품질6팀|김하은|G3|CL_G,DOE_Y,AU_Y,DS_Y", "emp_1308|인사지원센터|한임원|품질6팀|서민서|G3|DOE_Y,DS_Y,DA_G,CL_Y", "emp_1309|인사지원센터|한임원|품질6팀|안서윤|G3|ML_Y,DV_Y,PP_G,DS_G", "emp_1310|인사지원센터|한임원|품질6팀|황서준|G3|DA_G,TB_G,ML_G,PP_Y", "emp_1311|인사지원센터|한임원|품질6팀|황하은|G3|DA_SC,AU_B,TB_Y,ML_B,PP_Y,DOE_Y", "emp_1312|재무기획센터|권임원|관리4팀|임하준|G1|DOE_G,CL_Y,ML_Y,DV_G", "emp_1313|재무기획센터|권임원|관리4팀|전도윤|G1|CL_G,ML_G,DV_Y,DA_G", "emp_1314|재무기획센터|권임원|관리4팀|정준우|G1|DA_Y,DS_Y,DV_G,AU_Y", "emp_1315|재무기획센터|권임원|관리4팀|한지우|G1|ML_SC,DA_G,DOE_Y,PE_GC,PP_GC,DV_Y", "emp_1316|재무기획센터|권임원|관리4팀|강서윤|G2|DOE_SC,TB_Y,ML_G,DS_GC,DA_Y,DV_Y", "emp_1317|재무기획센터|권임원|관리4팀|박서연|G2|ML_G,PP_GC,CL_SC,DA_B,TB_G,AU_B,DOE_GC,PE_G,DS_GC,DV_Y", "emp_1318|재무기획센터|권임원|관리4팀|신민서|G2|TB_Y,DA_Y,DV_G,PP_Y", "emp_1319|재무기획센터|권임원|관리4팀|윤서현|G2|ML_B,DS_Y,AU_GC,CL_Y,PP_G,DV_G", "emp_1320|재무기획센터|권임원|관리4팀|이다은|G2|PE_Y,DV_GC,DOE_G,DA_Y,TB_SC,PP_G", "emp_1321|재무기획센터|권임원|관리4팀|임서연|G2|PP_GC,DV_G,ML_Y,DS_G,PE_G,DA_Y", "emp_1322|재무기획센터|권임원|관리4팀|장서연|G2|CL_Y,DOE_G,PP_Y,PE_Y", "emp_1323|재무기획센터|권임원|관리4팀|홍하은|G2|PP_Y,DV_Y,DOE_Y,AU_Y", "emp_1324|재무기획센터|권임원|관리4팀|황채원|G2|DS_Y,DOE_Y,DA_G,AU_G", "emp_1325|재무기획센터|권임원|관리4팀|황하은|G2|DOE_G,CL_G,DV_G,TB_G", "emp_1326|재무기획센터|권임원|관리4팀|권민준|G3|PE_B,DS_G,CL_G,TB_G,PP_G,ML_G", "emp_1327|재무기획센터|권임원|관리4팀|신준우|G3|DOE_G,PP_Y,DV_G,PE_Y", "emp_1328|재무기획센터|권임원|관리4팀|안수아|G3|PP_Y,TB_SC,CL_SC,DA_GC,ML_GC,PE_B,AU_GC,DOE_B,DV_GC", "emp_1329|재무기획센터|권임원|관리4팀|이예은|G3|DA_Y,DV_B,CL_G,ML_G,AU_SC,PE_Y", "emp_1330|재무기획센터|권임원|관리4팀|장지훈|G3|CL_B,AU_Y,PP_G,TB_Y,PE_Y,DS_GC", "emp_1331|재무기획센터|권임원|관리4팀|조예준|G3|DV_G,CL_Y,PP_Y,DS_G", "emp_1332|재무기획센터|송임원|품질팀|강준우|G1|ML_Y,AU_Y,DV_G,PP_G,DOE_SC,DS_G", "emp_1333|재무기획센터|송임원|품질팀|안서연|G1|DV_Y,TB_G,DS_G,PE_G,DA_B,PP_Y", "emp_1334|재무기획센터|송임원|품질팀|윤윤서|G1|DA_Y,DV_Y,PP_G,DOE_G", "emp_1335|재무기획센터|송임원|품질팀|이시우|G1|TB_GC,DV_GC,ML_B,DA_B,AU_Y,DOE_GC,CL_Y,PE_SC", "emp_1336|재무기획센터|송임원|품질팀|임민서|G1|ML_GC,TB_Y,DV_SC,CL_B,DA_G,DOE_G,PP_Y", "emp_1337|재무기획센터|송임원|품질팀|정다은|G1|PP_G,DV_G,ML_Y,DA_G,AU_G,DOE_B", "emp_1338|재무기획센터|송임원|품질팀|황하은|G1|ML_Y,CL_Y,DA_G,DS_Y", "emp_1339|재무기획센터|송임원|품질팀|권지유|G2|PE_G,DV_Y,DS_Y,TB_Y,PP_G,ML_G", "emp_1340|재무기획센터|송임원|품질팀|권하준|G2|PP_Y,DV_Y,ML_G,DS_Y", "emp_1341|재무기획센터|송임원|품질팀|박서연|G2|DOE_G,CL_Y,DA_Y,TB_Y", "emp_1342|재무기획센터|송임원|품질팀|박지아|G2|AU_Y,PE_Y,TB_G,PP_B,DA_B,CL_GC", "emp_1343|재무기획센터|송임원|품질팀|이다은|G2|PP_SC,DOE_SC,DV_B,PE_SC,DA_B,ML_GC,AU_Y,CL_G,TB_B,DS_B", "emp_1344|재무기획센터|송임원|품질팀|임도윤|G2|DV_Y,PE_G,DS_G,DA_B,AU_GC,CL_Y", "emp_1345|재무기획센터|송임원|품질팀|임민준|G2|DA_Y,CL_G,PE_G,PP_G", "emp_1346|재무기획센터|송임원|품질팀|장지우|G2|AU_Y,DS_G,CL_G,PE_Y", "emp_1347|재무기획센터|송임원|품질팀|조지호|G2|PE_G,TB_Y,PP_Y,DS_G", "emp_1348|재무기획센터|송임원|품질팀|한지민|G2|TB_Y,PP_Y,DOE_Y,ML_Y", "emp_1349|재무기획센터|송임원|품질팀|서서현|G3|PP_G,DOE_Y,TB_Y,AU_Y", "emp_1350|재무기획센터|송임원|품질팀|임서연|G3|CL_G,AU_G,PE_Y,PP_Y", "emp_1351|재무기획센터|송임원|품질팀|전지호|G3|CL_Y,DV_G,PP_G,DOE_Y", "emp_1352|재무기획센터|이임원|인사2팀|김도윤|G1|DOE_Y,DV_G,ML_G,TB_G,CL_Y,PE_SC", "emp_1353|재무기획센터|이임원|인사2팀|안민서|G1|TB_Y,DA_Y,CL_Y,AU_Y", "emp_1354|재무기획센터|이임원|인사2팀|윤서준|G1|DS_Y,ML_Y,DA_Y,PE_Y", "emp_1355|재무기획센터|이임원|인사2팀|윤수빈|G1|AU_Y,TB_Y,PE_Y,ML_Y", "emp_1356|재무기획센터|이임원|인사2팀|임민서|G1|DS_G,TB_Y,DA_Y,PP_Y", "emp_1357|재무기획센터|이임원|인사2팀|권지훈|G2|TB_G,ML_GC,CL_B,DS_B,DV_Y,DOE_B", "emp_1358|재무기획센터|이임원|인사2팀|송채원|G2|DA_Y,AU_G,ML_Y,PP_Y", "emp_1359|재무기획센터|이임원|인사2팀|신서연|G2|TB_Y,ML_B,DS_G,DV_SC,CL_Y,AU_G", "emp_1360|재무기획센터|이임원|인사2팀|신하은|G2|AU_Y,DOE_Y,ML_G,DA_Y", "emp_1361|재무기획센터|이임원|인사2팀|이도윤|G2|DS_G,DA_G,ML_Y,DOE_Y", "emp_1362|재무기획센터|이임원|인사2팀|이민준|G2|PP_Y,PE_Y,DOE_G,AU_G", "emp_1363|재무기획센터|이임원|인사2팀|이예준|G2|DOE_SC,TB_SC,ML_SC,CL_GC,DA_Y,AU_Y", "emp_1364|재무기획센터|이임원|인사2팀|정준우|G2|DA_Y,TB_G,AU_G,DOE_Y,ML_GC,PP_G,DS_GC,CL_G", "emp_1365|재무기획센터|이임원|인사2팀|황윤서|G2|DOE_G,PP_Y,DV_SC,CL_Y,DA_G,PE_Y", "emp_1366|재무기획센터|이임원|인사2팀|안지민|G3|PE_G,DOE_SC,DV_G,DA_G,TB_G,ML_Y", "emp_1367|재무기획센터|이임원|인사2팀|정준우|G3|CL_Y,PP_Y,DV_Y,DS_Y", "emp_1368|재무기획센터|이임원|인사2팀|조수빈|G3|AU_G,DS_Y,DOE_Y,PE_Y", "emp_1369|재무기획센터|이임원|인사2팀|홍시우|G3|DS_G,CL_Y,AU_SC,DA_G,PP_B,TB_Y", "emp_1370|재무기획센터|이임원|인사2팀|홍채원|G3|PE_Y,DS_G,DOE_G,DV_Y", "emp_1371|재무기획센터|이임원|인사2팀|황지우|G3|CL_Y,PE_G,DA_Y,DOE_Y", "emp_1372|재무기획센터|조임원|기술4팀|권수빈|G1|CL_Y,DOE_SC,ML_G,PE_Y,AU_G,TB_G", "emp_1373|재무기획센터|조임원|기술4팀|장지우|G1|DA_Y,CL_Y,TB_Y,DOE_G", "emp_1374|재무기획센터|조임원|기술4팀|전도윤|G1|PP_Y,TB_Y,DOE_Y,DA_Y", "emp_1375|재무기획센터|조임원|기술4팀|전도윤|G1|PP_G,PE_SC,DV_SC,ML_G,DA_B,DOE_Y", "emp_1376|재무기획센터|조임원|기술4팀|황서준|G1|CL_Y,PP_Y,ML_Y,TB_Y", "emp_1377|재무기획센터|조임원|기술4팀|박서준|G2|CL_G,ML_G,PP_Y,AU_Y", "emp_1378|재무기획센터|조임원|기술4팀|서서윤|G2|DS_G,PP_Y,DV_G,ML_Y", "emp_1379|재무기획센터|조임원|기술4팀|서하윤|G2|DS_G,DOE_Y,DV_GC,DA_B,ML_GC,AU_B", "emp_1380|재무기획센터|조임원|기술4팀|송수빈|G2|TB_Y,DA_G,PP_B,DOE_SC,DS_Y,PE_B", "emp_1381|재무기획센터|조임원|기술4팀|송준우|G2|AU_Y,DA_Y,ML_Y,TB_Y", "emp_1382|재무기획센터|조임원|기술4팀|송채원|G2|DV_Y,ML_Y,TB_Y,AU_Y", "emp_1383|재무기획센터|조임원|기술4팀|신채원|G2|DA_Y,DS_Y,TB_G,DOE_Y", "emp_1384|재무기획센터|조임원|기술4팀|이지우|G2|DV_Y,DOE_Y,ML_Y,PP_G", "emp_1385|재무기획센터|조임원|기술4팀|임준우|G2|ML_Y,PE_Y,DA_Y,DOE_Y", "emp_1386|재무기획센터|조임원|기술4팀|장서연|G2|DS_Y,PP_Y,ML_Y,CL_G", "emp_1387|재무기획센터|조임원|기술4팀|홍서연|G2|ML_B,DV_GC,CL_SC,PE_G,AU_Y,DA_Y", "emp_1388|재무기획센터|조임원|기술4팀|서시우|G3|DOE_GC,TB_G,DS_Y,DV_Y,PE_G,DA_GC,PP_SC,CL_SC,ML_B", "emp_1389|재무기획센터|조임원|기술4팀|오윤서|G3|AU_G,PP_G,CL_Y,DS_G", "emp_1390|재무기획센터|조임원|기술4팀|이지훈|G3|CL_G,DOE_B,AU_GC,PE_Y,DA_GC,TB_G", "emp_1391|재무기획센터|조임원|기술4팀|임채원|G3|PP_Y,DOE_Y,TB_B,DS_Y,AU_SC,CL_G", "emp_1392|재무기획센터|최임원|AX4팀|강수아|G1|DA_Y,CL_G,PP_GC,PE_Y,TB_SC,DV_Y,AU_GC,DS_GC", "emp_1393|재무기획센터|최임원|AX4팀|강지유|G1|PE_Y,DV_G,TB_G,PP_G", "emp_1394|재무기획센터|최임원|AX4팀|박시우|G1|TB_Y,PE_Y,AU_Y,DA_G", "emp_1395|재무기획센터|최임원|AX4팀|송민준|G1|ML_Y,TB_Y,DOE_Y,AU_Y", "emp_1396|재무기획센터|최임원|AX4팀|장예은|G1|DOE_GC,PE_GC,TB_Y,DS_GC,CL_B,ML_GC,AU_GC,DV_G,PP_GC,DA_GC", "emp_1397|재무기획센터|최임원|AX4팀|강지유|G2|TB_G,AU_G,ML_G,DS_G", "emp_1398|재무기획센터|최임원|AX4팀|권서현|G2|PP_Y,ML_Y,DV_Y,CL_G", "emp_1399|재무기획센터|최임원|AX4팀|신지훈|G2|DS_Y,PE_G,ML_G,AU_B,PP_Y,DOE_G", "emp_1400|재무기획센터|최임원|AX4팀|윤예준|G2|PP_Y,ML_Y,DV_G,DS_Y", "emp_1401|재무기획센터|최임원|AX4팀|임다은|G2|CL_G,DV_GC,ML_SC,DOE_GC,DS_GC,PP_B,DA_B,TB_SC", "emp_1402|재무기획센터|최임원|AX4팀|전윤서|G2|DOE_Y,CL_Y,DS_Y,PP_G", "emp_1403|재무기획센터|최임원|AX4팀|최수빈|G2|PE_G,DA_Y,ML_G,DOE_G", "emp_1404|재무기획센터|최임원|AX4팀|한윤서|G2|ML_G,AU_G,CL_Y,DV_Y", "emp_1405|재무기획센터|최임원|AX4팀|서지훈|G3|DOE_G,PP_G,DA_G,ML_GC,DV_B,PE_Y", "emp_1406|재무기획센터|최임원|AX4팀|윤도윤|G3|TB_G,DS_Y,DOE_B,PP_Y,PE_B,CL_Y", "emp_1407|재무기획센터|최임원|AX4팀|윤지유|G3|DV_Y,PP_G,DS_Y,AU_G", "emp_1408|재무기획센터|최임원|AX4팀|윤하은|G3|ML_B,AU_SC,PP_GC,TB_G,DS_Y,DOE_G", "emp_1409|재무기획센터|최임원|AX4팀|최예은|G3|PP_GC,DV_Y,TB_B,DS_G,CL_Y,DA_GC", "emp_1410|재무기획센터|최임원|AX4팀|최예은|G3|AU_G,DS_Y,DA_G,CL_G", "emp_1411|재무기획센터|한임원|회계7팀|송채원|G1|DV_Y,ML_Y,TB_G,PP_Y", "emp_1412|재무기획센터|한임원|회계7팀|안하준|G1|TB_G,ML_G,DA_Y,PP_Y", "emp_1413|재무기획센터|한임원|회계7팀|장준우|G1|AU_SC,DV_B,CL_SC,DS_G,TB_Y,PE_Y", "emp_1414|재무기획센터|한임원|회계7팀|장지우|G1|PP_Y,DOE_G,PE_G,AU_G", "emp_1415|재무기획센터|한임원|회계7팀|장지유|G1|AU_B,DOE_SC,DA_B,TB_G,PP_GC,PE_B,DV_SC,CL_G,DS_Y,ML_B", "emp_1416|재무기획센터|한임원|회계7팀|장지유|G1|DA_Y,PE_Y,ML_Y,DS_G", "emp_1417|재무기획센터|한임원|회계7팀|한예은|G1|PP_Y,ML_G,DS_G,DOE_G", "emp_1418|재무기획센터|한임원|회계7팀|강예은|G2|DOE_Y,PP_G,ML_Y,TB_Y", "emp_1419|재무기획센터|한임원|회계7팀|권서현|G2|DS_G,DV_Y,PP_SC,PE_G,TB_B,AU_Y", "emp_1420|재무기획센터|한임원|회계7팀|송예은|G2|ML_G,DV_Y,DOE_G,DA_G", "emp_1421|재무기획센터|한임원|회계7팀|송윤서|G2|ML_SC,DOE_G,TB_Y,DS_GC,DV_Y,CL_SC", "emp_1422|재무기획센터|한임원|회계7팀|송하윤|G2|TB_SC,ML_Y,DV_GC,DS_G,AU_Y,DOE_G,PP_GC,CL_SC,DA_B,PE_SC", "emp_1423|재무기획센터|한임원|회계7팀|안다은|G2|AU_B,DA_Y,DV_G,DS_G,ML_B,PP_Y", "emp_1424|재무기획센터|한임원|회계7팀|황하윤|G2|TB_Y,AU_G,DOE_Y,CL_G", "emp_1425|재무기획센터|한임원|회계7팀|서윤서|G3|PE_Y,DV_G,CL_G,DS_G", "emp_1426|재무기획센터|한임원|회계7팀|송지호|G3|AU_G,DA_Y,PE_Y,CL_G", "emp_1427|재무기획센터|한임원|회계7팀|오하은|G3|DA_Y,PE_G,DOE_Y,AU_G", "emp_1428|재무기획센터|한임원|회계7팀|이서윤|G3|DOE_G,DV_B,CL_G,ML_Y,DS_B,PE_GC", "emp_1429|재무기획센터|한임원|회계7팀|임하윤|G3|DV_GC,PP_G,DOE_SC,CL_Y,TB_B,DS_G", "emp_1430|재무기획센터|한임원|회계7팀|정민준|G3|DS_G,DOE_GC,ML_G,PE_G,DV_GC,CL_G", "emp_1431|전자재료사업본부|김임원|기획2팀|김지유|G1|PP_Y,DOE_Y,PE_Y,DA_G", "emp_1432|전자재료사업본부|김임원|기획2팀|오지훈|G1|CL_G,ML_G,PE_Y,DS_G", "emp_1433|전자재료사업본부|김임원|기획2팀|윤민준|G1|AU_SC,ML_SC,DS_Y,DOE_G,DV_G,PP_Y", "emp_1434|전자재료사업본부|김임원|기획2팀|임도윤|G1|ML_Y,DA_Y,PP_Y,DS_Y", "emp_1435|전자재료사업본부|김임원|기획2팀|임하은|G1|CL_G,PE_Y,DV_Y,ML_Y", "emp_1436|전자재료사업본부|김임원|기획2팀|장지호|G1|ML_G,PE_G,DV_G,PP_G", "emp_1437|전자재료사업본부|김임원|기획2팀|전예준|G1|PE_Y,PP_G,DOE_G,DS_G", "emp_1438|전자재료사업본부|김임원|기획2팀|한서현|G1|AU_B,DA_Y,PP_Y,DS_G,CL_Y,TB_G", "emp_1439|전자재료사업본부|김임원|기획2팀|신민서|G2|TB_Y,PP_B,DA_Y,CL_SC,ML_Y,DOE_B", "emp_1440|전자재료사업본부|김임원|기획2팀|안채원|G2|PP_G,CL_Y,DA_Y,DV_Y", "emp_1441|전자재료사업본부|김임원|기획2팀|임서윤|G2|PE_SC,ML_B,DA_G,CL_SC,DOE_B,AU_GC", "emp_1442|전자재료사업본부|김임원|기획2팀|한수아|G2|DS_Y,PE_Y,AU_G,DOE_Y", "emp_1443|전자재료사업본부|김임원|기획2팀|권지훈|G3|PE_Y,DV_Y,AU_Y,TB_Y", "emp_1444|전자재료사업본부|김임원|기획2팀|서민서|G3|TB_G,AU_Y,DOE_Y,CL_G", "emp_1445|전자재료사업본부|김임원|기획2팀|오민준|G3|PE_Y,DOE_Y,DV_GC,PP_G,TB_Y,AU_G", "emp_1446|전자재료사업본부|김임원|기획2팀|임지우|G3|CL_G,PE_Y,DOE_G,TB_G", "emp_1447|전자재료사업본부|김임원|기획2팀|한예준|G3|DA_Y,PE_B,ML_G,DOE_G,DV_Y,AU_SC", "emp_1448|전자재료사업본부|김임원|기획2팀|홍하은|G3|TB_Y,DV_Y,DOE_Y,PP_G", "emp_1449|전자재료사업본부|박임원|구매2팀|강지유|G1|DOE_G,PP_G,AU_Y,ML_Y", "emp_1450|전자재료사업본부|박임원|구매2팀|강하준|G1|PP_SC,TB_SC,DV_G,PE_Y,CL_G,DA_G", "emp_1451|전자재료사업본부|박임원|구매2팀|권지우|G1|AU_Y,CL_G,ML_G,DV_Y", "emp_1452|전자재료사업본부|박임원|구매2팀|김예준|G1|DS_G,PP_Y,DV_Y,DOE_G", "emp_1453|전자재료사업본부|박임원|구매2팀|이지훈|G1|AU_Y,DOE_Y,CL_Y,DV_G", "emp_1454|전자재료사업본부|박임원|구매2팀|김하준|G2|PP_SC,PE_Y,ML_SC,DS_SC,TB_Y,DOE_SC", "emp_1455|전자재료사업본부|박임원|구매2팀|박수빈|G2|TB_Y,DS_G,DV_Y,CL_Y", "emp_1456|전자재료사업본부|박임원|구매2팀|서서윤|G2|CL_GC,DS_Y,ML_GC,PP_GC,DOE_GC,PE_GC,DV_G", "emp_1457|전자재료사업본부|박임원|구매2팀|안수아|G2|TB_Y,DV_Y,DOE_Y,CL_Y", "emp_1458|전자재료사업본부|박임원|구매2팀|안준우|G2|DOE_G,AU_G,TB_G,ML_Y", "emp_1459|전자재료사업본부|박임원|구매2팀|오예준|G2|DOE_Y,ML_Y,PE_G,DA_G", "emp_1460|전자재료사업본부|박임원|구매2팀|임하은|G2|DOE_G,AU_Y,ML_Y,DA_Y", "emp_1461|전자재료사업본부|박임원|구매2팀|전서현|G2|ML_G,PE_GC,AU_G,DV_G,CL_GC,TB_GC,DOE_GC", "emp_1462|전자재료사업본부|박임원|구매2팀|조서준|G2|AU_Y,DA_Y,PP_Y,PE_Y", "emp_1463|전자재료사업본부|박임원|구매2팀|황지민|G2|TB_GC,PP_G,ML_SC,AU_GC,DA_G,CL_GC,DV_GC", "emp_1464|전자재료사업본부|박임원|구매2팀|안서현|G3|DV_G,AU_Y,CL_Y,DA_G", "emp_1465|전자재료사업본부|박임원|구매2팀|오예준|G3|DOE_G,AU_SC,ML_SC,PE_G,CL_Y,TB_Y", "emp_1466|전자재료사업본부|박임원|구매2팀|이민서|G3|DA_B,PP_Y,DS_G,TB_GC,PE_GC,ML_G", "emp_1467|전자재료사업본부|박임원|구매2팀|정하은|G3|DOE_B,PP_G,CL_SC,DA_Y,ML_GC,TB_G", "emp_1468|전자재료사업본부|박임원|구매2팀|황서연|G3|DS_Y,TB_G,DV_Y,AU_G", "emp_1469|전자재료사업본부|오임원|구매4팀|윤준우|G1|DA_GC,ML_GC,DV_Y,CL_G,AU_G,DOE_Y", "emp_1470|전자재료사업본부|오임원|구매4팀|장준우|G1|ML_G,AU_SC,TB_SC,DOE_GC,PE_G,DV_GC", "emp_1471|전자재료사업본부|오임원|구매4팀|박서현|G2|DS_G,AU_SC,CL_G,PE_SC,DV_GC,DA_GC", "emp_1472|전자재료사업본부|오임원|구매4팀|이수아|G2|AU_Y,PP_Y,DS_G,TB_G", "emp_1473|전자재료사업본부|오임원|구매4팀|전서현|G2|DA_Y,ML_Y,TB_G,DOE_GC,PE_B,AU_SC", "emp_1474|전자재료사업본부|오임원|구매4팀|전윤서|G2|DS_G,DOE_Y,PP_Y,DA_G", "emp_1475|전자재료사업본부|오임원|구매4팀|최하은|G2|TB_G,ML_Y,PE_Y,AU_Y", "emp_1476|전자재료사업본부|오임원|구매4팀|홍채원|G2|TB_G,DS_G,DA_Y,PP_G", "emp_1477|전자재료사업본부|오임원|구매4팀|권지호|G3|TB_G,DA_Y,DOE_Y,DV_G", "emp_1478|전자재료사업본부|오임원|구매4팀|서지유|G3|PP_Y,TB_Y,CL_Y,ML_Y", "emp_1479|전자재료사업본부|오임원|구매4팀|송주원|G3|PE_G,DA_G,ML_Y,PP_G", "emp_1480|전자재료사업본부|오임원|구매4팀|신서윤|G3|ML_Y,TB_Y,PE_G,DS_Y", "emp_1481|전자재료사업본부|오임원|구매4팀|정지유|G3|DS_Y,PE_G,CL_Y,ML_Y", "emp_1482|전자재료사업본부|오임원|구매4팀|최수빈|G3|ML_Y,DA_G,TB_G,DS_Y", "emp_1483|전자재료사업본부|오임원|구매4팀|최지아|G3|DA_GC,DV_SC,PE_Y,DOE_G,TB_Y,AU_Y", "emp_1484|전자재료사업본부|오임원|구매4팀|홍서현|G3|ML_G,PP_Y,AU_Y,DV_Y", "emp_1485|전자재료사업본부|장임원|연구3팀|송민서|G1|ML_B,CL_G,DOE_B,DA_GC,PP_G,DS_GC", "emp_1486|전자재료사업본부|장임원|연구3팀|정서준|G1|PE_Y,DS_G,TB_Y,DA_Y", "emp_1487|전자재료사업본부|장임원|연구3팀|정지유|G1|DV_Y,PP_B,DA_Y,ML_G,PE_Y,TB_G", "emp_1488|전자재료사업본부|장임원|연구3팀|홍준우|G1|CL_G,DOE_G,TB_Y,PE_B,PP_Y,ML_GC", "emp_1489|전자재료사업본부|장임원|연구3팀|신예준|G2|PP_G,TB_Y,DA_G,ML_Y", "emp_1490|전자재료사업본부|장임원|연구3팀|장시우|G2|PP_Y,PE_Y,AU_G,CL_Y", "emp_1491|전자재료사업본부|장임원|연구3팀|최예준|G2|DOE_Y,PE_G,AU_Y,DA_Y", "emp_1492|전자재료사업본부|장임원|연구3팀|최예준|G2|CL_Y,PE_Y,DV_Y,DA_Y", "emp_1493|전자재료사업본부|장임원|연구3팀|한시우|G2|ML_Y,TB_Y,DOE_G,DS_Y,DA_GC,PP_Y", "emp_1494|전자재료사업본부|장임원|연구3팀|홍서윤|G2|TB_SC,DOE_GC,DA_Y,PE_SC,PP_SC,DV_SC,CL_G,ML_G", "emp_1495|전자재료사업본부|장임원|연구3팀|홍서현|G2|DS_G,DV_G,ML_Y,DOE_Y", "emp_1496|전자재료사업본부|장임원|연구3팀|김채원|G3|AU_G,PE_B,ML_SC,DS_GC,DOE_Y,PP_Y", "emp_1497|전자재료사업본부|장임원|연구3팀|서지우|G3|PE_Y,CL_Y,PP_G,DA_Y", "emp_1498|전자재료사업본부|장임원|연구3팀|장지훈|G3|ML_Y,DV_G,TB_B,DA_B,AU_GC,CL_SC", "emp_1499|전자재료사업본부|장임원|연구3팀|전윤서|G3|PE_Y,TB_B,DOE_G,DA_Y,DV_GC,AU_G", "emp_1500|전자재료사업본부|장임원|연구3팀|조예은|G3|DA_Y,AU_Y,CL_Y,DS_G", "emp_1501|전자재료사업본부|정임원|생산2팀|박지유|G1|CL_G,PE_G,PP_G,DS_Y", "emp_1502|전자재료사업본부|정임원|생산2팀|안다은|G1|PE_Y,CL_Y,DS_Y,PP_Y,DV_Y,DA_SC", "emp_1503|전자재료사업본부|정임원|생산2팀|홍수아|G1|DS_G,TB_G,PP_G,DA_Y", "emp_1504|전자재료사업본부|정임원|생산2팀|권수빈|G2|PP_Y,CL_G,TB_Y,PE_Y", "emp_1505|전자재료사업본부|정임원|생산2팀|김수빈|G2|TB_G,AU_Y,DS_G,PE_Y", "emp_1506|전자재료사업본부|정임원|생산2팀|김윤서|G2|AU_Y,DV_Y,PP_G,TB_Y", "emp_1507|전자재료사업본부|정임원|생산2팀|김지훈|G2|PE_Y,DS_B,AU_G,PP_Y,CL_Y,DV_SC", "emp_1508|전자재료사업본부|정임원|생산2팀|서시우|G2|TB_Y,ML_Y,DA_G,DOE_Y", "emp_1509|전자재료사업본부|정임원|생산2팀|서채원|G2|PP_G,TB_G,DOE_G,DS_G", "emp_1510|전자재료사업본부|정임원|생산2팀|오하은|G2|DA_Y,PE_Y,DOE_Y,DS_Y", "emp_1511|전자재료사업본부|정임원|생산2팀|윤예준|G2|PE_Y,AU_G,TB_G,DV_G", "emp_1512|전자재료사업본부|정임원|생산2팀|이서윤|G2|AU_Y,DV_Y,TB_B,CL_Y,DA_G,PE_G", "emp_1513|전자재료사업본부|정임원|생산2팀|임민준|G2|PE_GC,DV_Y,PP_Y,ML_B,TB_G,CL_B", "emp_1514|전자재료사업본부|정임원|생산2팀|황서현|G2|DA_Y,AU_Y,PP_G,DV_G", "emp_1515|전자재료사업본부|정임원|생산2팀|박서현|G3|PP_G,DA_Y,ML_Y,DOE_Y", "emp_1516|전자재료사업본부|정임원|생산2팀|윤수빈|G3|DS_Y,DOE_Y,ML_Y,PE_Y", "emp_1517|전자재료사업본부|정임원|생산2팀|한지민|G3|DOE_Y,PP_SC,DS_GC,DV_G,PE_Y,CL_G", "emp_1518|전자재료사업본부|정임원|생산2팀|홍서현|G3|PP_Y,DV_Y,PE_GC,DA_G,DOE_SC,ML_G", "emp_1519|전자재료사업본부|홍임원|지원5팀|강예준|G1|DOE_Y,DS_Y,DV_Y,AU_Y", "emp_1520|전자재료사업본부|홍임원|지원5팀|강지유|G1|ML_G,DS_Y,TB_G,PE_Y", "emp_1521|전자재료사업본부|홍임원|지원5팀|권하윤|G1|DA_G,CL_Y,DV_G,DS_Y", "emp_1522|전자재료사업본부|홍임원|지원5팀|서하은|G1|PP_GC,DS_SC,AU_SC,TB_GC,DOE_SC,DA_Y,DV_G", "emp_1523|전자재료사업본부|홍임원|지원5팀|이시우|G1|DV_Y,DS_Y,PP_Y,DA_G", "emp_1524|전자재료사업본부|홍임원|지원5팀|전서현|G1|CL_G,PE_Y,PP_Y,DS_Y", "emp_1525|전자재료사업본부|홍임원|지원5팀|권서윤|G2|PP_Y,DV_Y,CL_G,TB_Y,ML_GC,PE_SC", "emp_1526|전자재료사업본부|홍임원|지원5팀|김예은|G2|DS_B,CL_SC,PE_B,AU_B,TB_G,DV_SC,PP_Y,ML_SC", "emp_1527|전자재료사업본부|홍임원|지원5팀|송민준|G2|TB_SC,DOE_SC,PE_SC,ML_SC,DA_G,DV_GC,DS_Y", "emp_1528|전자재료사업본부|홍임원|지원5팀|오지유|G2|DV_GC,DS_GC,TB_SC,DOE_Y,ML_Y,DA_G", "emp_1529|전자재료사업본부|홍임원|지원5팀|전지아|G2|AU_SC,PP_B,ML_SC,TB_Y,CL_SC,DOE_G,PE_Y", "emp_1530|전자재료사업본부|홍임원|지원5팀|조주원|G2|DV_Y,TB_Y,DOE_SC,CL_GC,AU_B,DA_Y", "emp_1531|전자재료사업본부|홍임원|지원5팀|김하윤|G3|CL_G,AU_G,DV_Y,ML_Y", "emp_1532|전자재료사업본부|홍임원|지원5팀|신지아|G3|PP_B,ML_G,DOE_Y,DS_G,DA_SC,TB_B", "emp_1533|전자재료사업본부|홍임원|지원5팀|윤준우|G3|PP_SC,DA_GC,DV_G,CL_GC,ML_Y,AU_G", "emp_1534|전자재료사업본부|홍임원|지원5팀|임도윤|G3|DV_B,PP_Y,ML_G,DOE_B,AU_B,CL_GC", "emp_1535|전자재료사업본부|홍임원|지원5팀|정도윤|G3|PE_Y,TB_G,AU_Y,DA_Y", "emp_1536|전자재료사업본부|홍임원|지원5팀|황준우|G3|DA_G,TB_Y,DV_Y,CL_Y", "emp_1537|전자재료사업본부|황임원|혁신6팀|강서현|G1|AU_G,TB_Y,DA_Y,DV_Y", "emp_1538|전자재료사업본부|황임원|혁신6팀|박지민|G1|DA_Y,AU_Y,PE_G,TB_G", "emp_1539|전자재료사업본부|황임원|혁신6팀|임도윤|G1|DS_Y,CL_G,PE_G,DA_Y", "emp_1540|전자재료사업본부|황임원|혁신6팀|장서연|G1|DA_Y,TB_GC,PP_GC,DOE_G,ML_GC,DS_Y", "emp_1541|전자재료사업본부|황임원|혁신6팀|장수빈|G1|TB_Y,PP_SC,DV_G,PE_B,ML_Y,DS_Y", "emp_1542|전자재료사업본부|황임원|혁신6팀|정하준|G1|DV_G,DOE_Y,CL_G,PE_G", "emp_1543|전자재료사업본부|황임원|혁신6팀|한준우|G1|DV_G,PP_Y,PE_SC,ML_G,CL_GC,DS_Y", "emp_1544|전자재료사업본부|황임원|혁신6팀|황지아|G1|PP_Y,PE_G,TB_Y,ML_Y", "emp_1545|전자재료사업본부|황임원|혁신6팀|윤도윤|G2|CL_Y,DOE_Y,TB_Y,ML_Y", "emp_1546|전자재료사업본부|황임원|혁신6팀|이채원|G2|CL_B,DA_GC,AU_G,DS_B,DV_G,PE_GC,TB_SC,ML_B,DOE_B,PP_GC", "emp_1547|전자재료사업본부|황임원|혁신6팀|장지유|G2|PP_GC,ML_SC,CL_SC,PE_G,DV_SC,DS_Y,DA_B,TB_GC,AU_SC", "emp_1548|전자재료사업본부|황임원|혁신6팀|전서연|G2|DA_Y,ML_G,PE_G,DV_G", "emp_1549|전자재료사업본부|황임원|혁신6팀|정서준|G2|ML_Y,TB_G,PE_Y,PP_G", "emp_1550|전자재료사업본부|황임원|혁신6팀|조지훈|G2|DS_GC,ML_GC,DV_GC,PE_G,AU_Y,DOE_G,CL_B,PP_GC,TB_B,DA_GC", "emp_1551|전자재료사업본부|황임원|혁신6팀|조하준|G2|CL_Y,DV_G,DA_Y,PE_Y", "emp_1552|전자재료사업본부|황임원|혁신6팀|한하윤|G2|DV_G,DS_Y,ML_GC,DA_Y,DOE_SC,AU_Y", "emp_1553|전자재료사업본부|황임원|혁신6팀|황서윤|G2|DS_Y,AU_Y,PP_Y,TB_G", "emp_1554|전자재료사업본부|황임원|혁신6팀|황하은|G2|AU_Y,PP_G,DS_Y,PE_Y", "emp_1555|전자재료사업본부|황임원|혁신6팀|정수아|G3|ML_G,DS_Y,DV_G,CL_G,TB_Y,PP_Y", "emp_1556|전자재료사업본부|황임원|혁신6팀|조예준|G3|DV_GC,PP_G,CL_Y,TB_G,DA_G,ML_GC", "emp_1557|첨단소재사업본부|김임원|회계2팀|안민준|G1|DOE_G,DS_B,PE_G,PP_Y,ML_G,CL_SC", "emp_1558|첨단소재사업본부|김임원|회계2팀|안수빈|G1|TB_Y,PE_Y,DA_G,DS_Y", "emp_1559|첨단소재사업본부|김임원|회계2팀|오민서|G1|TB_G,DS_Y,ML_Y,DOE_B,DA_G,CL_B", "emp_1560|첨단소재사업본부|김임원|회계2팀|윤시우|G1|DS_SC,PP_GC,DA_SC,PE_GC,CL_GC,AU_B,TB_G,DV_Y,DOE_GC", "emp_1561|첨단소재사업본부|김임원|회계2팀|조다은|G1|PP_G,DV_Y,DS_GC,CL_SC,DA_Y,ML_GC", "emp_1562|첨단소재사업본부|김임원|회계2팀|강지민|G2|AU_G,DS_G,PE_Y,TB_G", "emp_1563|첨단소재사업본부|김임원|회계2팀|강하준|G2|CL_Y,DOE_Y,DV_Y,PP_G", "emp_1564|첨단소재사업본부|김임원|회계2팀|오하윤|G2|DV_Y,DS_G,AU_Y,PP_G", "emp_1565|첨단소재사업본부|김임원|회계2팀|홍지훈|G2|CL_Y,ML_Y,PE_Y,AU_Y", "emp_1566|첨단소재사업본부|김임원|회계2팀|홍하은|G2|PP_Y,DV_B,TB_GC,DA_GC,AU_B,CL_SC,ML_GC,PE_Y", "emp_1567|첨단소재사업본부|김임원|회계2팀|강하윤|G3|DV_GC,DS_GC,TB_GC,AU_B,DA_B,DOE_SC", "emp_1568|첨단소재사업본부|김임원|회계2팀|강하윤|G3|DA_Y,PP_Y,TB_Y,ML_Y", "emp_1569|첨단소재사업본부|김임원|회계2팀|권지훈|G3|AU_GC,DS_SC,DOE_Y,TB_B,PP_GC,ML_Y,CL_GC,DV_GC,PE_Y", "emp_1570|첨단소재사업본부|김임원|회계2팀|김주원|G3|ML_G,DV_Y,PP_G,DA_Y", "emp_1571|첨단소재사업본부|김임원|회계2팀|송채원|G3|DOE_G,DA_G,CL_Y,AU_Y", "emp_1572|첨단소재사업본부|김임원|회계2팀|오서연|G3|DOE_GC,DA_G,DV_SC,PE_Y,CL_B,PP_SC,TB_GC,DS_B,ML_Y", "emp_1573|첨단소재사업본부|김임원|회계2팀|장다은|G3|ML_SC,PE_B,CL_Y,DOE_B,DV_GC,TB_G", "emp_1574|첨단소재사업본부|오임원|기획팀|강수아|G1|PP_Y,CL_Y,DOE_G,PE_G", "emp_1575|첨단소재사업본부|오임원|기획팀|강윤서|G1|DOE_Y,DS_G,DV_G,CL_G", "emp_1576|첨단소재사업본부|오임원|기획팀|김민준|G1|DV_Y,CL_Y,AU_Y,TB_G", "emp_1577|첨단소재사업본부|오임원|기획팀|서민준|G1|CL_Y,DV_G,PP_G,TB_Y", "emp_1578|첨단소재사업본부|오임원|기획팀|송서준|G1|AU_Y,ML_Y,DV_Y,PP_Y", "emp_1579|첨단소재사업본부|오임원|기획팀|안하은|G1|PP_Y,ML_Y,PE_Y,CL_G", "emp_1580|첨단소재사업본부|오임원|기획팀|이다은|G1|DOE_Y,PP_Y,ML_Y,CL_Y", "emp_1581|첨단소재사업본부|오임원|기획팀|홍도윤|G1|AU_G,ML_Y,DS_Y,DA_Y", "emp_1582|첨단소재사업본부|오임원|기획팀|박서현|G2|DS_G,DA_Y,CL_Y,PP_Y", "emp_1583|첨단소재사업본부|오임원|기획팀|박하준|G2|DS_SC,AU_G,CL_G,DA_G,DOE_B,ML_G", "emp_1584|첨단소재사업본부|오임원|기획팀|송하은|G2|CL_G,DV_Y,DOE_G,PE_G", "emp_1585|첨단소재사업본부|오임원|기획팀|신하은|G2|PP_SC,CL_B,DV_G,AU_Y,DOE_G,TB_B", "emp_1586|첨단소재사업본부|오임원|기획팀|안수아|G2|DS_Y,DOE_B,PP_B,AU_G,TB_GC,DA_G", "emp_1587|첨단소재사업본부|오임원|기획팀|윤하은|G2|DA_Y,ML_G,PE_G,AU_Y", "emp_1588|첨단소재사업본부|오임원|기획팀|정윤서|G2|DA_SC,DOE_B,PP_B,ML_G,AU_SC,PE_B,DV_GC,TB_Y", "emp_1589|첨단소재사업본부|오임원|기획팀|최민준|G2|PE_Y,ML_Y,DV_Y,DOE_G", "emp_1590|첨단소재사업본부|오임원|기획팀|홍하은|G2|ML_G,PP_Y,DS_Y,DV_G", "emp_1591|첨단소재사업본부|오임원|기획팀|이서윤|G3|DS_Y,TB_Y,PE_Y,DOE_G", "emp_1592|첨단소재사업본부|오임원|기획팀|최서연|G3|DA_G,DOE_Y,DS_Y,TB_GC,PP_B,ML_G", "emp_1593|첨단소재사업본부|윤임원|영업2팀|강민서|G1|AU_GC,PE_B,ML_Y,DA_SC,PP_B,DS_B", "emp_1594|첨단소재사업본부|윤임원|영업2팀|김준우|G1|DOE_G,DS_G,DA_Y,TB_Y", "emp_1595|첨단소재사업본부|윤임원|영업2팀|김하은|G1|CL_Y,DV_G,DA_Y,DOE_G", "emp_1596|첨단소재사업본부|윤임원|영업2팀|신서현|G1|CL_G,DV_G,AU_G,DOE_SC,DS_GC,PP_Y,TB_Y,DA_B,ML_G", "emp_1597|첨단소재사업본부|윤임원|영업2팀|최예은|G1|CL_GC,ML_GC,DV_GC,PE_G,DOE_GC,AU_GC", "emp_1598|첨단소재사업본부|윤임원|영업2팀|최준우|G1|CL_Y,ML_G,DV_Y,DS_Y", "emp_1599|첨단소재사업본부|윤임원|영업2팀|최지우|G1|ML_Y,PP_G,DS_Y,DOE_Y", "emp_1600|첨단소재사업본부|윤임원|영업2팀|한서윤|G1|PE_Y,DS_Y,PP_Y,CL_Y", "emp_1601|첨단소재사업본부|윤임원|영업2팀|김지훈|G2|PP_G,DA_Y,AU_G,DV_G", "emp_1602|첨단소재사업본부|윤임원|영업2팀|오예준|G2|CL_G,DS_G,TB_G,DA_Y", "emp_1603|첨단소재사업본부|윤임원|영업2팀|전수빈|G2|PE_Y,TB_Y,DA_G,PP_Y", "emp_1604|첨단소재사업본부|윤임원|영업2팀|홍다은|G2|CL_G,DV_G,DOE_Y,DA_G", "emp_1605|첨단소재사업본부|윤임원|영업2팀|박지아|G3|DA_G,ML_G,AU_G,PE_G", "emp_1606|첨단소재사업본부|윤임원|영업2팀|송도윤|G3|DOE_Y,DA_Y,DS_G,DV_Y", "emp_1607|첨단소재사업본부|윤임원|영업2팀|오서윤|G3|CL_Y,ML_G,DOE_Y,DA_Y", "emp_1608|첨단소재사업본부|윤임원|영업2팀|오하윤|G3|DV_G,PE_Y,ML_Y,TB_G", "emp_1609|첨단소재사업본부|윤임원|영업2팀|윤하은|G3|DA_Y,DOE_Y,DV_Y,PP_Y", "emp_1610|첨단소재사업본부|이임원|구매6팀|서서윤|G1|PE_G,DOE_G,DV_Y,DA_Y", "emp_1611|첨단소재사업본부|이임원|구매6팀|전예은|G1|AU_G,DS_G,DA_Y,TB_G", "emp_1612|첨단소재사업본부|이임원|구매6팀|전지훈|G1|ML_Y,AU_Y,PP_Y,DS_G", "emp_1613|첨단소재사업본부|이임원|구매6팀|강수아|G2|TB_Y,ML_Y,AU_Y,PE_Y", "emp_1614|첨단소재사업본부|이임원|구매6팀|권민서|G2|ML_Y,DA_G,DS_G,PE_Y", "emp_1615|첨단소재사업본부|이임원|구매6팀|김민준|G2|DA_Y,TB_G,CL_G,ML_Y", "emp_1616|첨단소재사업본부|이임원|구매6팀|김예은|G2|ML_GC,PP_GC,TB_SC,DA_SC,DOE_B,PE_Y,DS_SC,AU_SC,DV_SC", "emp_1617|첨단소재사업본부|이임원|구매6팀|김지호|G2|ML_Y,TB_G,PP_G,AU_G", "emp_1618|첨단소재사업본부|이임원|구매6팀|이지민|G2|PE_GC,PP_B,ML_Y,CL_B,TB_B,DV_G", "emp_1619|첨단소재사업본부|이임원|구매6팀|임서연|G2|ML_SC,PP_Y,TB_G,DS_Y,DA_B,PE_G", "emp_1620|첨단소재사업본부|이임원|구매6팀|장지훈|G2|CL_Y,ML_Y,DV_Y,DS_G", "emp_1621|첨단소재사업본부|이임원|구매6팀|황하윤|G2|CL_G,ML_Y,PE_G,DS_Y", "emp_1622|첨단소재사업본부|이임원|구매6팀|안지호|G3|DOE_G,PE_G,CL_Y,DS_Y", "emp_1623|첨단소재사업본부|이임원|구매6팀|임지호|G3|DOE_B,ML_Y,DA_G,DS_SC,PP_G,PE_GC", "emp_1624|첨단소재사업본부|이임원|구매6팀|최지훈|G3|DS_G,PP_G,PE_Y,AU_Y", "emp_1625|첨단소재사업본부|이임원|구매6팀|황지아|G3|AU_Y,DOE_SC,DV_SC,PE_GC,DS_G,TB_G", "emp_1626|첨단소재사업본부|전임원|사업3팀|김지우|G1|TB_Y,AU_G,CL_B,ML_Y,PP_GC,DV_SC", "emp_1627|첨단소재사업본부|전임원|사업3팀|오도윤|G1|AU_Y,TB_G,ML_G,DA_G", "emp_1628|첨단소재사업본부|전임원|사업3팀|임하윤|G1|DA_G,DOE_Y,CL_Y,DV_Y", "emp_1629|첨단소재사업본부|전임원|사업3팀|최수아|G1|DOE_Y,TB_Y,ML_Y,CL_G", "emp_1630|첨단소재사업본부|전임원|사업3팀|한예은|G1|DA_Y,ML_G,PP_Y,DV_G", "emp_1631|첨단소재사업본부|전임원|사업3팀|강수빈|G2|PE_G,DA_G,ML_SC,TB_SC,DOE_G,DV_Y", "emp_1632|첨단소재사업본부|전임원|사업3팀|오도윤|G2|DV_G,PP_Y,DOE_G,ML_G", "emp_1633|첨단소재사업본부|전임원|사업3팀|윤예준|G2|DS_G,DA_SC,ML_G,PP_GC,DOE_G,TB_SC,CL_GC,DV_GC,PE_G", "emp_1634|첨단소재사업본부|전임원|사업3팀|정지우|G2|PE_G,DOE_G,PP_Y,DA_G", "emp_1635|첨단소재사업본부|전임원|사업3팀|최예준|G2|DS_Y,TB_Y,AU_Y,DOE_Y", "emp_1636|첨단소재사업본부|전임원|사업3팀|홍하준|G2|AU_Y,PE_G,DV_G,ML_G", "emp_1637|첨단소재사업본부|전임원|사업3팀|강서준|G3|DV_GC,TB_SC,PE_B,CL_GC,AU_GC,DA_Y", "emp_1638|첨단소재사업본부|전임원|사업3팀|송서현|G3|PE_Y,DA_G,DOE_G,DS_Y", "emp_1639|첨단소재사업본부|전임원|사업3팀|오윤서|G3|PP_Y,DS_Y,DV_G,TB_Y", "emp_1640|첨단소재사업본부|전임원|사업3팀|윤윤서|G3|DV_SC,PE_Y,DOE_GC,DS_G,PP_B,DA_Y,TB_GC,AU_B,ML_GC", "emp_1641|첨단소재사업본부|전임원|사업3팀|장서연|G3|DV_SC,CL_Y,PP_GC,ML_Y,DOE_G,DS_GC", "emp_1642|첨단소재사업본부|정임원|회계팀|신준우|G1|PE_Y,DS_Y,ML_Y,PP_Y", "emp_1643|첨단소재사업본부|정임원|회계팀|안민준|G1|DS_G,TB_Y,PP_Y,DOE_Y", "emp_1644|첨단소재사업본부|정임원|회계팀|안윤서|G1|DOE_SC,AU_Y,ML_B,DS_Y,DV_B,PP_GC", "emp_1645|첨단소재사업본부|정임원|회계팀|윤다은|G1|CL_G,DOE_Y,PE_G,DS_G", "emp_1646|첨단소재사업본부|정임원|회계팀|장수아|G1|DOE_Y,PE_GC,PP_B,TB_Y,DA_G,DV_Y", "emp_1647|첨단소재사업본부|정임원|회계팀|전지민|G1|PP_G,ML_Y,DOE_G,DV_G", "emp_1648|첨단소재사업본부|정임원|회계팀|조수빈|G1|ML_Y,DOE_G,PP_Y,PE_Y", "emp_1649|첨단소재사업본부|정임원|회계팀|송민준|G2|DOE_G,DA_Y,ML_G,TB_Y", "emp_1650|첨단소재사업본부|정임원|회계팀|송서준|G2|PE_Y,ML_Y,DS_Y,DOE_Y", "emp_1651|첨단소재사업본부|정임원|회계팀|송주원|G2|DA_G,DV_G,AU_Y,PP_Y", "emp_1652|첨단소재사업본부|정임원|회계팀|오서연|G2|AU_Y,DOE_GC,DS_SC,PP_SC,DV_GC,DA_B,ML_G", "emp_1653|첨단소재사업본부|정임원|회계팀|오지민|G2|ML_G,PP_Y,DS_G,CL_Y", "emp_1654|첨단소재사업본부|정임원|회계팀|임하은|G2|DA_Y,DOE_Y,TB_G,DV_G", "emp_1655|첨단소재사업본부|정임원|회계팀|박민준|G3|ML_G,PP_Y,CL_G,DV_Y", "emp_1656|첨단소재사업본부|정임원|회계팀|박하윤|G3|ML_G,AU_Y,DV_Y,DA_Y", "emp_1657|첨단소재사업본부|정임원|회계팀|전지훈|G3|DA_Y,ML_G,CL_G,DOE_Y,DS_GC,TB_GC", "emp_1658|첨단소재사업본부|정임원|회계팀|조서연|G3|PE_Y,DS_G,ML_Y,PP_Y", "emp_1659|첨단소재사업본부|정임원|회계팀|한시우|G3|PP_Y,DA_GC,PE_Y,DS_B,ML_G,DOE_GC", "emp_1660|첨단소재사업본부|정임원|회계팀|황다은|G3|TB_SC,DV_B,DS_SC,PP_SC,ML_SC,DOE_SC,CL_GC,PE_B", "emp_1661|첨단소재사업본부|황임원|기술2팀|오민서|G1|CL_Y,PE_Y,DS_Y,ML_G", "emp_1662|첨단소재사업본부|황임원|기술2팀|장지유|G1|AU_Y,DV_G,DS_Y,ML_Y", "emp_1663|첨단소재사업본부|황임원|기술2팀|전서윤|G1|AU_Y,PP_B,DV_G,DOE_GC,ML_GC,DA_G", "emp_1664|첨단소재사업본부|황임원|기술2팀|한서준|G1|AU_Y,ML_Y,DV_G,DA_Y", "emp_1665|첨단소재사업본부|황임원|기술2팀|홍지민|G1|DOE_G,PP_GC,ML_B,TB_Y,DA_SC,DS_SC", "emp_1666|첨단소재사업본부|황임원|기술2팀|박주원|G2|ML_G,PP_Y,DOE_Y,DV_Y", "emp_1667|첨단소재사업본부|황임원|기술2팀|윤다은|G2|ML_Y,PE_G,AU_G,DA_G", "emp_1668|첨단소재사업본부|황임원|기술2팀|윤지우|G2|ML_G,CL_Y,DV_G,AU_G", "emp_1669|첨단소재사업본부|황임원|기술2팀|이서준|G2|AU_SC,DS_B,TB_G,CL_Y,DV_G,DA_GC", "emp_1670|첨단소재사업본부|황임원|기술2팀|임예은|G2|PE_Y,AU_G,TB_G,DA_G", "emp_1671|첨단소재사업본부|황임원|기술2팀|장서연|G2|DV_SC,DS_GC,AU_Y,CL_B,PP_B,ML_G", "emp_1672|첨단소재사업본부|황임원|기술2팀|장서현|G2|TB_SC,ML_B,DOE_GC,CL_SC,PE_GC,PP_SC,DA_GC,DS_B", "emp_1673|첨단소재사업본부|황임원|기술2팀|전하은|G2|AU_B,PE_SC,CL_SC,DV_SC,ML_SC,DA_G", "emp_1674|첨단소재사업본부|황임원|기술2팀|조준우|G2|DV_Y,PE_G,AU_Y,DS_Y", "emp_1675|첨단소재사업본부|황임원|기술2팀|권민서|G3|DA_GC,PE_G,DS_B,DV_Y,AU_Y,PP_Y", "emp_1676|첨단소재사업본부|황임원|기술2팀|박수아|G3|AU_G,DOE_Y,PE_Y,TB_G", "emp_1677|첨단소재사업본부|황임원|기술2팀|송하준|G3|PP_G,TB_Y,DS_Y,DOE_Y", "emp_1678|첨단소재사업본부|황임원|기술2팀|윤지유|G3|DA_GC,PE_GC,TB_Y,AU_SC,DS_SC,PP_SC,DOE_GC", "emp_1679|첨단소재사업본부|황임원|기술2팀|전도윤|G3|DA_G,DOE_Y,PE_Y,CL_G", "emp_1680|첨단소재사업본부|황임원|기술2팀|조지아|G3|PE_Y,DA_GC,PP_Y,CL_G,AU_Y,DV_SC", "emp_1681|품질혁신센터|강임원|품질2팀|김수빈|G1|PE_Y,DOE_G,PP_Y,TB_Y", "emp_1682|품질혁신센터|강임원|품질2팀|서지우|G1|AU_Y,CL_G,DV_Y,DS_Y", "emp_1683|품질혁신센터|강임원|품질2팀|서지유|G1|ML_G,TB_G,PP_Y,DA_G", "emp_1684|품질혁신센터|강임원|품질2팀|이하은|G1|TB_Y,CL_Y,DA_G,DV_Y", "emp_1685|품질혁신센터|강임원|품질2팀|임하준|G1|DV_G,PP_Y,DOE_G,TB_G,ML_GC,AU_SC", "emp_1686|품질혁신센터|강임원|품질2팀|권서연|G2|DV_Y,TB_G,DOE_GC,ML_G,DS_GC,AU_B", "emp_1687|품질혁신센터|강임원|품질2팀|박수빈|G2|AU_Y,PE_Y,PP_Y,TB_Y", "emp_1688|품질혁신센터|강임원|품질2팀|박수아|G2|DOE_G,TB_G,AU_Y,DS_Y", "emp_1689|품질혁신센터|강임원|품질2팀|임수빈|G2|AU_G,DS_Y,TB_Y,DV_G", "emp_1690|품질혁신센터|강임원|품질2팀|박지호|G3|DV_Y,PP_Y,DOE_G,TB_Y", "emp_1691|품질혁신센터|강임원|품질2팀|서지민|G3|AU_G,DS_G,CL_G,TB_G", "emp_1692|품질혁신센터|강임원|품질2팀|신윤서|G3|AU_G,PE_G,DA_G,TB_GC,PP_G,ML_G", "emp_1693|품질혁신센터|강임원|품질2팀|전하은|G3|DS_Y,PP_Y,AU_Y,ML_G", "emp_1694|품질혁신센터|강임원|품질2팀|최채원|G3|DA_G,DOE_Y,DV_Y,TB_Y", "emp_1695|품질혁신센터|김임원|품질3팀|강수빈|G1|TB_B,DS_SC,DOE_Y,PE_G,DV_Y,AU_G", "emp_1696|품질혁신센터|김임원|품질3팀|김수빈|G1|TB_SC,DA_G,DS_G,PP_B,AU_Y,CL_SC", "emp_1697|품질혁신센터|김임원|품질3팀|서하은|G1|ML_B,PP_G,CL_G,DA_GC,PE_Y,DS_GC,TB_GC", "emp_1698|품질혁신센터|김임원|품질3팀|신서연|G1|PE_G,CL_G,DV_Y,AU_G,DA_G,PP_SC", "emp_1699|품질혁신센터|김임원|품질3팀|조지아|G1|DS_Y,DV_Y,ML_Y,DOE_Y", "emp_1700|품질혁신센터|김임원|품질3팀|한민서|G1|DA_Y,PP_Y,PE_G,DV_Y", "emp_1701|품질혁신센터|김임원|품질3팀|황도윤|G1|DA_B,ML_GC,TB_B,PP_GC,DS_SC,AU_B,PE_GC,CL_GC,DV_SC,DOE_SC", "emp_1702|품질혁신센터|김임원|품질3팀|권서현|G2|ML_Y,CL_G,DV_Y,AU_Y", "emp_1703|품질혁신센터|김임원|품질3팀|권하준|G2|DOE_Y,TB_Y,DA_G,PE_Y", "emp_1704|품질혁신센터|김임원|품질3팀|홍하윤|G2|AU_Y,DOE_G,DS_Y,CL_G", "emp_1705|품질혁신센터|김임원|품질3팀|황수빈|G2|PP_G,DV_G,AU_G,CL_Y", "emp_1706|품질혁신센터|김임원|품질3팀|권지호|G3|DS_SC,ML_GC,DA_GC,TB_GC,PP_Y,DV_GC", "emp_1707|품질혁신센터|김임원|품질3팀|서서준|G3|DS_Y,ML_G,DOE_G,TB_GC,DA_G,PP_GC", "emp_1708|품질혁신센터|김임원|품질3팀|신지훈|G3|DOE_Y,CL_G,DA_Y,TB_G", "emp_1709|품질혁신센터|김임원|품질3팀|윤하윤|G3|TB_G,ML_G,PE_G,DS_G", "emp_1710|품질혁신센터|김임원|품질3팀|이서연|G3|DV_Y,DS_G,PE_G,DA_Y", "emp_1711|품질혁신센터|김임원|품질3팀|조서윤|G3|ML_G,DV_G,PP_G,CL_Y", "emp_1712|품질혁신센터|김임원|품질3팀|홍서윤|G3|DA_Y,DV_Y,PP_G,TB_G", "emp_1713|품질혁신센터|박임원|관리2팀|강예은|G1|CL_B,DA_Y,TB_B,AU_Y,ML_B,PP_Y", "emp_1714|품질혁신센터|박임원|관리2팀|서서준|G1|AU_Y,DOE_G,TB_G,DS_Y", "emp_1715|품질혁신센터|박임원|관리2팀|송준우|G1|DA_Y,PP_Y,TB_G,ML_Y", "emp_1716|품질혁신센터|박임원|관리2팀|안서준|G1|DOE_G,CL_Y,DS_G,ML_SC,DV_SC,PP_B", "emp_1717|품질혁신센터|박임원|관리2팀|장지아|G1|PE_Y,DOE_Y,ML_G,TB_SC,PP_B,CL_B", "emp_1718|품질혁신센터|박임원|관리2팀|정주원|G1|ML_Y,PE_Y,DS_Y,PP_Y", "emp_1719|품질혁신센터|박임원|관리2팀|김서연|G2|PE_G,ML_Y,PP_Y,DA_Y", "emp_1720|품질혁신센터|박임원|관리2팀|박지아|G2|DS_Y,PP_Y,ML_Y,DV_G", "emp_1721|품질혁신센터|박임원|관리2팀|신서현|G2|DV_G,AU_Y,PE_Y,CL_Y", "emp_1722|품질혁신센터|박임원|관리2팀|이지호|G2|PE_SC,DS_G,PP_GC,ML_Y,DV_Y,DOE_B", "emp_1723|품질혁신센터|박임원|관리2팀|임예준|G2|DS_SC,CL_SC,TB_GC,DA_GC,DOE_Y,PP_GC,AU_G,ML_B", "emp_1724|품질혁신센터|박임원|관리2팀|전채원|G2|ML_G,TB_G,DS_B,PP_B,DA_SC,AU_GC", "emp_1725|품질혁신센터|박임원|관리2팀|조하윤|G2|PE_Y,ML_Y,AU_Y,TB_G", "emp_1726|품질혁신센터|박임원|관리2팀|한지아|G2|AU_G,DS_Y,DA_G,CL_Y", "emp_1727|품질혁신센터|박임원|관리2팀|황서현|G2|PP_G,AU_G,ML_G,DS_GC,DA_Y,PE_SC", "emp_1728|품질혁신센터|박임원|관리2팀|황윤서|G2|DOE_Y,DS_Y,TB_Y,PE_Y", "emp_1729|품질혁신센터|박임원|관리2팀|송준우|G3|DV_Y,ML_Y,DOE_Y,PP_G", "emp_1730|품질혁신센터|박임원|관리2팀|오시우|G3|CL_Y,DV_Y,PP_G,TB_G", "emp_1731|품질혁신센터|박임원|관리2팀|전서현|G3|DA_B,TB_SC,DV_G,DOE_GC,PE_SC,ML_Y", "emp_1732|품질혁신센터|박임원|관리2팀|홍하윤|G3|PP_Y,PE_B,ML_G,DV_B,TB_SC,DA_Y", "emp_1733|품질혁신센터|신임원|전략7팀|송수아|G1|DS_Y,TB_Y,ML_G,DA_G", "emp_1734|품질혁신센터|신임원|전략7팀|조민준|G1|CL_Y,PP_G,TB_Y,DV_G", "emp_1735|품질혁신센터|신임원|전략7팀|황예은|G1|ML_B,DS_G,TB_GC,DOE_SC,PE_SC,DV_G,CL_SC", "emp_1736|품질혁신센터|신임원|전략7팀|강준우|G2|PE_B,DA_SC,DV_B,AU_B,CL_GC,DOE_G,TB_GC,DS_Y,ML_Y", "emp_1737|품질혁신센터|신임원|전략7팀|박주원|G2|DA_G,PE_G,PP_G,AU_Y", "emp_1738|품질혁신센터|신임원|전략7팀|서예은|G2|CL_Y,PP_Y,TB_G,DV_G", "emp_1739|품질혁신센터|신임원|전략7팀|송준우|G2|DS_Y,CL_Y,TB_G,DV_G", "emp_1740|품질혁신센터|신임원|전략7팀|안민서|G2|CL_B,ML_B,PE_SC,TB_G,DS_GC,DV_G,PP_Y", "emp_1741|품질혁신센터|신임원|전략7팀|윤지아|G2|DOE_G,CL_G,ML_SC,DV_Y,PP_Y,AU_G", "emp_1742|품질혁신센터|신임원|전략7팀|정지훈|G2|CL_Y,TB_G,DOE_G,ML_G", "emp_1743|품질혁신센터|신임원|전략7팀|황도윤|G2|CL_G,DOE_G,ML_G,PP_Y", "emp_1744|품질혁신센터|신임원|전략7팀|강지훈|G3|DOE_Y,TB_Y,CL_G,ML_Y", "emp_1745|품질혁신센터|신임원|전략7팀|권준우|G3|TB_B,DS_Y,ML_G,AU_G,CL_G,PE_Y", "emp_1746|품질혁신센터|신임원|전략7팀|송예은|G3|CL_G,ML_B,PE_B,DS_G,DOE_GC,TB_B", "emp_1747|품질혁신센터|신임원|전략7팀|최하준|G3|ML_B,DS_G,CL_G,AU_SC,PP_G,DA_SC", "emp_1748|품질혁신센터|안임원|사업6팀|김준우|G1|CL_Y,ML_Y,DS_G,AU_Y", "emp_1749|품질혁신센터|안임원|사업6팀|조하윤|G1|AU_Y,DA_Y,CL_Y,PE_Y", "emp_1750|품질혁신센터|안임원|사업6팀|최민준|G1|CL_Y,DA_Y,DOE_G,TB_Y", "emp_1751|품질혁신센터|안임원|사업6팀|강민서|G2|PP_G,TB_G,DA_GC,DV_SC,PE_B,DOE_SC", "emp_1752|품질혁신센터|안임원|사업6팀|김예은|G2|DV_Y,DS_Y,ML_G,DOE_G", "emp_1753|품질혁신센터|안임원|사업6팀|서하준|G2|PP_GC,DOE_Y,DS_G,AU_GC,DA_GC,CL_B,ML_SC,TB_GC", "emp_1754|품질혁신센터|안임원|사업6팀|오지우|G2|DV_G,TB_G,CL_Y,DOE_Y", "emp_1755|품질혁신센터|안임원|사업6팀|윤서현|G2|TB_GC,DS_G,PP_Y,DA_B,DV_G,AU_Y", "emp_1756|품질혁신센터|안임원|사업6팀|임지아|G2|DS_SC,CL_Y,PE_B,ML_SC,TB_Y,DA_Y", "emp_1757|품질혁신센터|안임원|사업6팀|전민준|G2|PE_G,ML_G,DS_Y,DA_Y", "emp_1758|품질혁신센터|안임원|사업6팀|전시우|G2|PP_Y,DOE_B,TB_Y,AU_Y,DS_G,DV_G", "emp_1759|품질혁신센터|안임원|사업6팀|전하윤|G2|DV_SC,PP_G,DS_GC,ML_B,TB_GC,DA_Y,DOE_Y,PE_SC,AU_SC", "emp_1760|품질혁신센터|안임원|사업6팀|정수아|G2|TB_B,PP_Y,PE_Y,DV_GC,ML_Y,DS_GC", "emp_1761|품질혁신센터|안임원|사업6팀|권예준|G3|DOE_Y,DV_Y,DS_Y,DA_Y", "emp_1762|품질혁신센터|안임원|사업6팀|신민서|G3|PE_SC,ML_B,DS_G,TB_Y,PP_Y,CL_Y", "emp_1763|품질혁신센터|안임원|사업6팀|윤수빈|G3|DV_Y,TB_Y,CL_G,PE_Y", "emp_1764|품질혁신센터|안임원|사업6팀|윤수빈|G3|DS_Y,TB_G,CL_Y,DV_Y", "emp_1765|품질혁신센터|안임원|사업6팀|정지호|G3|TB_Y,PP_Y,DS_G,PE_Y", "emp_1766|품질혁신센터|안임원|사업6팀|조서현|G3|DS_G,TB_Y,AU_G,PE_Y", "emp_1767|품질혁신센터|안임원|사업6팀|한지아|G3|ML_Y,PP_Y,DV_Y,TB_G", "emp_1768|품질혁신센터|임임원|기술3팀|김지훈|G1|ML_G,DV_Y,DA_Y,PP_SC,DS_Y,DOE_G", "emp_1769|품질혁신센터|임임원|기술3팀|이지훈|G1|DS_Y,AU_Y,DOE_B,PP_GC,ML_Y,TB_GC", "emp_1770|품질혁신센터|임임원|기술3팀|조민서|G1|DS_Y,ML_G,DA_Y,CL_Y", "emp_1771|품질혁신센터|임임원|기술3팀|황다은|G1|DS_B,DA_GC,PE_GC,AU_SC,DV_GC,TB_G,CL_GC,ML_Y,PP_SC,DOE_SC", "emp_1772|품질혁신센터|임임원|기술3팀|서하윤|G2|DA_Y,PP_G,TB_G,PE_G", "emp_1773|품질혁신센터|임임원|기술3팀|송민준|G2|ML_Y,CL_Y,DV_SC,DOE_G,PE_GC,DA_Y", "emp_1774|품질혁신센터|임임원|기술3팀|이민준|G2|DS_G,PE_G,PP_G,ML_Y", "emp_1775|품질혁신센터|임임원|기술3팀|장윤서|G2|DS_G,AU_G,PP_G,DA_B,DV_G,CL_Y", "emp_1776|품질혁신센터|임임원|기술3팀|장지유|G2|DV_Y,PP_Y,DS_G,TB_G,PE_G,DA_Y", "emp_1777|품질혁신센터|임임원|기술3팀|전하윤|G2|DV_G,DS_Y,AU_Y,ML_G", "emp_1778|품질혁신센터|임임원|기술3팀|홍서윤|G2|PP_Y,CL_Y,DS_G,ML_G", "emp_1779|품질혁신센터|임임원|기술3팀|홍준우|G2|CL_Y,DA_G,DS_Y,AU_G", "emp_1780|품질혁신센터|임임원|기술3팀|권하준|G3|DV_Y,DS_Y,PE_G,DA_G", "emp_1781|품질혁신센터|임임원|기술3팀|김지우|G3|DV_G,AU_Y,DOE_GC,TB_G,PE_G,CL_G", "emp_1782|품질혁신센터|임임원|기술3팀|박지우|G3|DOE_G,AU_G,ML_Y,DS_G", "emp_1783|품질혁신센터|임임원|기술3팀|안윤서|G3|DA_Y,DS_SC,CL_G,DOE_GC,PP_G,ML_SC", "emp_1784|품질혁신센터|임임원|기술3팀|임지훈|G3|DV_G,DOE_Y,TB_G,CL_Y", "emp_1785|품질혁신센터|임임원|기술3팀|임하윤|G3|TB_Y,DV_G,ML_G,AU_G", "emp_1786|품질혁신센터|임임원|기술3팀|정도윤|G3|DOE_G,DA_Y,CL_Y,DS_Y", "emp_1787|품질혁신센터|최임원|기획3팀|안도윤|G1|TB_G,AU_Y,ML_Y,DOE_G", "emp_1788|품질혁신센터|최임원|기획3팀|안준우|G1|DOE_G,ML_Y,DS_Y,PE_Y", "emp_1789|품질혁신센터|최임원|기획3팀|정예준|G1|DA_G,ML_G,AU_Y,PE_Y", "emp_1790|품질혁신센터|최임원|기획3팀|최하은|G1|ML_Y,CL_Y,TB_Y,PP_Y", "emp_1791|품질혁신센터|최임원|기획3팀|윤수빈|G2|ML_G,PE_G,DOE_G,TB_Y", "emp_1792|품질혁신센터|최임원|기획3팀|장도윤|G2|AU_Y,PP_Y,TB_Y,DOE_Y", "emp_1793|품질혁신센터|최임원|기획3팀|장서현|G2|ML_Y,PE_G,DOE_G,DS_Y", "emp_1794|품질혁신센터|최임원|기획3팀|전수아|G2|PP_B,DA_G,DV_GC,TB_Y,ML_SC,DS_B", "emp_1795|품질혁신센터|최임원|기획3팀|전준우|G2|DOE_B,CL_B,AU_B,DV_B,TB_Y,DA_Y", "emp_1796|품질혁신센터|최임원|기획3팀|한서준|G2|CL_Y,TB_G,DV_SC,PP_GC,DS_GC,ML_B,PE_Y", "emp_1797|품질혁신센터|최임원|기획3팀|김서윤|G3|DOE_G,DA_Y,PE_Y,AU_Y", "emp_1798|품질혁신센터|최임원|기획3팀|오지호|G3|DS_GC,DV_Y,CL_SC,PE_Y,DA_B,ML_B,PP_GC,AU_G,TB_Y", "emp_1799|품질혁신센터|최임원|기획3팀|전준우|G3|ML_Y,PE_Y,AU_Y,CL_G", "emp_1800|품질혁신센터|최임원|기획3팀|홍수아|G3|DA_SC,DV_GC,PP_Y,DS_Y,CL_G,PE_SC"];

// Seed dispatch history for executives over the last 1 year
const INITIAL_EXEC_HISTORY: Record<string, EmailRecord[]> = {"홍임원": [{"id": "eh-1", "date": "2026-08-18 10:15", "sender": "인사혁신담당 <hr.ax@axage.corp>", "subject": "[AXAGE 배지 매니징] DX센터/R&D센터 소속 배지 미충족 인원 독려 지휘 요청", "recipient": "홍임원 전무 <executive.hong@axage.corp>", "targetCount": 73, "preview": "홍임원님 관할 AX팀, 전략4팀 소속 미충족 인원 73명에 대한 하반기 집중 배지 취득 지휘를 요청드렸습니다."}, {"id": "eh-2", "date": "2026-05-12 14:30", "sender": "인사혁신담당 <hr.ax@axage.corp>", "subject": "[AXAGE 배지 매니징] 상반기 AX 필수 배지 직급별 취득 점검 및 조직 지휘 요청", "recipient": "홍임원 전무 <executive.hong@axage.corp>", "targetCount": 73, "preview": "상반기 배지 취득 마감에 앞서 소속 인원들의 온라인 강의 이수 및 상시 테스트 응시 지도 요청."}], "윤임원": [{"id": "eh-3", "date": "2026-09-02 09:40", "sender": "인사혁신담당 <hr.ax@axage.corp>", "subject": "[AXAGE 배지 매니징] ESG경영센터/기초소재 AX7팀 배지 취득 미충족 인원 지휘 요청", "recipient": "윤임원 상무 <executive.yoon@axage.corp>", "targetCount": 53, "preview": "관할 조직 미충족 인원 53명에 대한 직급별 필수 배지 취득 집중 코칭 독려."}], "조임원": [{"id": "eh-4", "date": "2026-07-25 11:20", "sender": "인사혁신담당 <hr.ax@axage.corp>", "subject": "[AXAGE 배지 매니징] 글로벌전략/인사지원/재무기획 배지 취득 현황 지휘 요청", "recipient": "조임원 전무 <executive.cho@axage.corp>", "targetCount": 91, "preview": "소속 91명의 AX 배지 미충족 인원에 대한 직급별 필수 배지 취득 일정 점검."}], "김임원": [{"id": "eh-5", "date": "2026-08-28 16:05", "sender": "인사혁신담당 <hr.ax@axage.corp>", "subject": "[AXAGE 배지 매니징] 글로벌전략/석유화학/마케팅 소속 배지 취득 독려 요청", "recipient": "김임원 부사장 <executive.kim@axage.corp>", "targetCount": 170, "preview": "혁신2팀, 생산4팀, 인사4팀 등 관할 170명 미충족 구성원에 대한 역량 강화 프로세스 지휘 요청."}]};

// Generate realistic seed dispatch history for some members
const INITIAL_MEMBER_HISTORY: Record<string, EmailRecord[]> = {
  emp_1: [
    {
      id: 'mh-1',
      date: '2026-07-15 11:00',
      sender: '인사혁신담당 <hr.ax@axage.corp>',
      subject: '[AXAGE 배지 권고] 박수아님 G1 직급 필수 배지(DS_G, CL_G, DA_G, DV_G) 취득 권고',
      recipient: '박수아 G1 <수아.박@axage.corp>',
      preview: '박수아님의 현재 G1 필수 배지 기준 미충족 상태에 대해 3분기 사내 AX 아카데미 수강 및 시험 응시를 안내드렸습니다.'
    }
  ],
  emp_8: [
    {
      id: 'mh-2',
      date: '2026-08-01 14:20',
      sender: '인사혁신담당 <hr.ax@axage.corp>',
      subject: '[AXAGE 배지 권고] 박주원님 G2 필수 배지 추가 취득 안내',
      recipient: '박주원 G2 <주원.박@axage.corp>',
      preview: '필수 배지 취득 기한 경과 방지를 위한 8월 상시 테스트 일정 안내.'
    }
  ]
};

// Monthly historical trend (last 10 months: 2026.01 ~ 2026.10)
const MONTHLY_TREND_DATA = [
  { month: '2026.01', G1: 0.6, G2: 0.8, G3: 0.5, total: 0.7 },
  { month: '2026.02', G1: 0.8, G2: 1.0, G3: 0.7, total: 0.9 },
  { month: '2026.03', G1: 1.0, G2: 1.2, G3: 0.9, total: 1.1 },
  { month: '2026.04', G1: 1.2, G2: 1.5, G3: 1.1, total: 1.3 },
  { month: '2026.05', G1: 1.3, G2: 1.8, G3: 1.3, total: 1.5 },
  { month: '2026.06', G1: 1.5, G2: 2.1, G3: 1.4, total: 1.7 },
  { month: '2026.07', G1: 1.7, G2: 2.3, G3: 1.6, total: 1.9 },
  { month: '2026.08', G1: 1.9, G2: 2.5, G3: 1.8, total: 2.1 },
  { month: '2026.09', G1: 2.1, G2: 2.6, G3: 1.9, total: 2.3 },
  { month: '2026.10', G1: 2.3, G2: 2.8, G3: 2.0, total: 2.4 }
];

// ==========================================
// 2. MAIN APPLICATION COMPONENT
// ==========================================

export default function App() {
  // Master Members State (parsed from packed data)
  const [members, setMembers] = useState<MemberProcess[]>(() => {
    return PACKED_MEMBERS_DATA.map((line) => {
      const parts = line.split('|');
      const id = parts[0];
      const org = parts[1];
      const executive = parts[2];
      const team = parts[3];
      const name = parts[4];
      const rank = parts[5] as 'G1' | 'G2' | 'G3';
      const badges = parts[6] ? parts[6].split(',') : [];

      const reqs = REQ_MAP[rank] || [];
      const missingBadges = reqs.filter((req) => !hasBadgeQualified(badges, req));
      const isFulfilled = missingBadges.length === 0;

      return {
        id,
        org,
        executive,
        team,
        name,
        rank,
        badges,
        missingBadges,
        isFulfilled,
        deficientCount: missingBadges.length
      };
    });
  });

  // UI States
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('2026-10-08 18:30:00');

  // Email Histories State
  const [execEmailHistory, setExecEmailHistory] = useState<Record<string, EmailRecord[]>>(INITIAL_EXEC_HISTORY);
  const [memberEmailHistory, setMemberEmailHistory] = useState<Record<string, EmailRecord[]>>(INITIAL_MEMBER_HISTORY);

  // Selection state for Executives (Left table)
  const [selectedExecs, setSelectedExecs] = useState<Set<string>>(new Set());

  // Selection state for Members (Right table)
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

  // Search & Filter state for Members
  const [memberSearch, setMemberSearch] = useState('');
  const [filterOrg, setFilterOrg] = useState('ALL');
  const [filterRank, setFilterRank] = useState<'ALL' | 'G1' | 'G2' | 'G3'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'UNFULFILLED' | 'FULFILLED'>('ALL');
  const [memberPage, setMemberPage] = useState(1);
  const rowsPerPage = 20;

  // Active Modals State
  const [activeExecModal, setActiveExecModal] = useState<string | null>(null);
  const [activeMemberModal, setActiveMemberModal] = useState<MemberProcess | null>(null);
  const [activeBulkExecModal, setActiveBulkExecModal] = useState(false);
  const [activeBulkMemberModal, setActiveBulkMemberModal] = useState(false);

  // Modal Email Form Edit & Tab States
  const [modalMode, setModalMode] = useState<'VIEW' | 'EDIT' | 'HISTORY'>('VIEW');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // Toast auto-dismiss
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // 1. 배지정보 새로고침 핸들러
  const handleRefreshBadges = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      const now = new Date();
      const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      setLastSyncTime(timeStr);
      showToast('업데이트 완료되었습니다.');
    }, 600);
  };

  // ==========================================
  // 3. STATISTICAL CALCULATIONS
  // ==========================================

  // Overall KPI
  const stats = useMemo(() => {
    const total = members.length;
    const fulfilled = members.filter((m) => m.isFulfilled).length;
    const unfulfilled = total - fulfilled;
    const fulfilledRate = total > 0 ? (fulfilled / total) * 100 : 0;

    const rankStats = {
      G1: { total: 0, fulfilled: 0 },
      G2: { total: 0, fulfilled: 0 },
      G3: { total: 0, fulfilled: 0 }
    };

    members.forEach((m) => {
      rankStats[m.rank].total += 1;
      if (m.isFulfilled) rankStats[m.rank].fulfilled += 1;
    });

    return {
      total,
      fulfilled,
      unfulfilled,
      fulfilledRate,
      rankStats
    };
  }, [members]);

  // Executive list sorted by highest unfulfilled rate (Requirement 5)
  const execList = useMemo(() => {
    const map: Record<string, { executive: string; org: string; total: number; fulfilled: number; unfulfilled: number; members: MemberProcess[] }> = {};

    members.forEach((m) => {
      if (!map[m.executive]) {
        map[m.executive] = {
          executive: m.executive,
          org: m.org,
          total: 0,
          fulfilled: 0,
          unfulfilled: 0,
          members: []
        };
      }
      map[m.executive].total += 1;
      map[m.executive].members.push(m);
      if (m.isFulfilled) {
        map[m.executive].fulfilled += 1;
      } else {
        map[m.executive].unfulfilled += 1;
      }
    });

    // Sort descending by unfulfilled rate (highest unfulfilled rate first)
    return Object.values(map).sort((a, b) => {
      const rateA = a.unfulfilled / a.total;
      const rateB = b.unfulfilled / b.total;
      if (rateB !== rateA) return rateB - rateA;
      return b.unfulfilled - a.unfulfilled;
    });
  }, [members]);

  // Badge Acquisition Rates (Requirement 3 - sorted in ascending order of acquisition rate)
  const badgeRates = useMemo(() => {
    const targetBadges: Record<string, { badge: string; reqRanks: string[]; denominator: number; numerator: number }> = {};

    // Initialize required badges across ranks
    (['G1', 'G2', 'G3'] as const).forEach((rank) => {
      REQ_MAP[rank].forEach((b) => {
        if (!targetBadges[b]) {
          targetBadges[b] = { badge: b, reqRanks: [], denominator: 0, numerator: 0 };
        }
        if (!targetBadges[b].reqRanks.includes(rank)) {
          targetBadges[b].reqRanks.push(rank);
        }
      });
    });

    // Calculate numerator & denominator
    members.forEach((m) => {
      const reqs = REQ_MAP[m.rank];
      reqs.forEach((req) => {
        targetBadges[req].denominator += 1;
        if (hasBadgeQualified(m.badges, req)) {
          targetBadges[req].numerator += 1;
        }
      });
    });

    // Sort ascending (lowest acquisition rate first)
    return Object.values(targetBadges).sort((a, b) => {
      const rateA = a.denominator > 0 ? a.numerator / a.denominator : 0;
      const rateB = b.denominator > 0 ? b.numerator / b.denominator : 0;
      return rateA - rateB;
    });
  }, [members]);

  // Filtered & Sorted Members List (Requirement 8 - unfulfilled members first)
  const filteredMembers = useMemo(() => {
    let result = members.filter((m) => {
      if (filterOrg !== 'ALL' && m.org !== filterOrg) return false;
      if (filterRank !== 'ALL' && m.rank !== filterRank) return false;
      if (filterStatus === 'UNFULFILLED' && m.isFulfilled) return false;
      if (filterStatus === 'FULFILLED' && !m.isFulfilled) return false;
      if (memberSearch.trim()) {
        const query = memberSearch.trim().toLowerCase();
        const matchName = m.name.toLowerCase().includes(query);
        const matchTeam = m.team.toLowerCase().includes(query);
        const matchExec = m.executive.toLowerCase().includes(query);
        const matchOrg = m.org.toLowerCase().includes(query);
        if (!matchName && !matchTeam && !matchExec && !matchOrg) return false;
      }
      return true;
    });

    // Sort: unfulfilled first (most deficient badges first), then fulfilled
    result.sort((a, b) => {
      if (a.isFulfilled !== b.isFulfilled) {
        return a.isFulfilled ? 1 : -1;
      }
      if (b.deficientCount !== a.deficientCount) {
        return b.deficientCount - a.deficientCount;
      }
      return a.name.localeCompare(b.name, 'ko');
    });

    return result;
  }, [members, filterOrg, filterRank, filterStatus, memberSearch]);

  const totalMemberPages = Math.ceil(filteredMembers.length / rowsPerPage) || 1;
  const paginatedMembers = useMemo(() => {
    const start = (memberPage - 1) * rowsPerPage;
    return filteredMembers.slice(start, start + rowsPerPage);
  }, [filteredMembers, memberPage]);

  // Unique Orgs for filter dropdown
  const uniqueOrgs = useMemo(() => {
    return Array.from(new Set(members.map((m) => m.org))).sort();
  }, [members]);

  // ==========================================
  // 4. SELECTION HANDLERS
  // ==========================================

  // Executive checkbox selection
  const isAllExecsSelected = execList.length > 0 && selectedExecs.size === execList.length;
  const toggleSelectAllExecs = () => {
    if (isAllExecsSelected) {
      setSelectedExecs(new Set());
    } else {
      setSelectedExecs(new Set(execList.map((e) => e.executive)));
    }
  };

  const toggleSelectExec = (exec: string) => {
    const next = new Set(selectedExecs);
    if (next.has(exec)) next.delete(exec);
    else next.add(exec);
    setSelectedExecs(next);
  };

  // Member checkbox selection
  const isAllMembersSelected = filteredMembers.length > 0 && selectedMembers.size === filteredMembers.length;
  const toggleSelectAllMembers = () => {
    if (isAllMembersSelected) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(filteredMembers.map((m) => m.id)));
    }
  };

  const toggleSelectMember = (id: string) => {
    const next = new Set(selectedMembers);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedMembers(next);
  };

  // ==========================================
  // 5. EMAIL MODAL ACTIONS (REQUIREMENT 6 & 8)
  // ==========================================

  // Open Executive Modal (Requirement 6)
  const openExecModal = (execName: string) => {
    const execData = execList.find((e) => e.executive === execName);
    if (!execData) return;

    const unfulfilledMembers = execData.members.filter((m) => !m.isFulfilled);

    const defaultSubject = `[AXAGE 배지 매니징] ${execName} 관리 조직 (${execData.org}) 배지 기준 미충족 인원 지휘 및 취득 독려 요청의 건`;

    const memberListText = unfulfilledMembers
      .map(
        (m, idx) =>
          `${idx + 1}. [${m.team}] ${m.name} (${m.rank}) - 현재 배지: ${m.badges.length ? m.badges.join(', ') : '없음'} | 추가 요구 필수 배지: ${m.missingBadges.join(', ')}`
      )
      .join('\n');

    const defaultBody = `안녕하십니까, ${execName}님.
인사혁신 / AX 추진 본부입니다.

귀하께서 총괄 관리하고 계신 ${execData.org}의 구성원 중, 2026년 직급별 필수 AX 배지 취득 기준을 현재 충족하지 못한 인원이 확인되어 적극적인 지휘와 독려를 요청드립니다.

■ 관할 조직 배지 취득 현황 요약
- 총 관리 인원: ${execData.total}명
- 배지 취득 기준 충족: ${execData.fulfilled}명 (${((execData.fulfilled / execData.total) * 100).toFixed(1)}%)
- 배지 기준 미충족 인원: ${unfulfilledMembers.length}명 (${((unfulfilledMembers.length / execData.total) * 100).toFixed(1)}%)

■ 미충족 구성원 및 추가 요구 배지 목록:
${memberListText}

각 구성원이 시기를 놓치지 않고 필수 배지를 취득하여 조직 전반의 디지털 전환 역량이 강화될 수 있도록 많은 지도와 관심 부탁드립니다.

감사합니다.
인사혁신 / AX 추진팀 드림`;

    setActiveExecModal(execName);
    setEmailSubject(defaultSubject);
    setEmailBody(defaultBody);
    setModalMode('VIEW');
  };

  // Open Member Modal (Requirement 8)
  const openMemberModal = (m: MemberProcess) => {
    const reqs = REQ_MAP[m.rank].join(', ');
    const curr = m.badges.length ? m.badges.join(', ') : '미보유';
    const missing = m.missingBadges.length ? m.missingBadges.join(', ') : '전부 충족';

    const defaultSubject = `[AXAGE 배지 권고] ${m.name}님 ${m.rank} 직급 필수 배지 추가 취득 안내 및 권고`;
    const defaultBody = `안녕하십니까, ${m.org} ${m.team} ${m.name}님.
인사혁신 / AX 추진팀입니다.

회사의 AX(AI Transformation) 역량 강화를 위해 도입된 직급별 필수 배지 제도와 관련하여, ${m.name}님의 배지 취득 현황 및 추가 요구 배지를 안내해 드립니다.

■ 배지 취득 현황 점검
- 소속 / 직급: ${m.org} ${m.team} / ${m.rank}
- ${m.rank} 직급 필수 배지 기준: ${reqs}
- 현재 취득 완료 배지: ${curr}
- ${m.missingBadges.length ? `★ 추가 요구 배지 (부족 부분): ${missing}` : '모든 필수 배지 기준을 완료하셨습니다.'}

${
  m.missingBadges.length
    ? `현재 부족한 배지는 금 분기 내에 조속히 취득하실 수 있도록 사내 교육 및 상시 평가 응시를 적극 권고드립니다. 시기를 놓치지 않고 취득하시어 개인 역량 향상 및 인사 평가에 불이익이 없도록 유의하시기 바랍니다.`
    : `축하드립니다. ${m.name}님은 현재 직급에 요구되는 필수 배지 요건을 모두 충족하셨습니다.`
}

관련 교육 일정 및 시험 응시 링크는 사내 AXAGE 포털에서 확인하실 수 있습니다.

감사합니다.
인사혁신 / AX 추진팀 드림`;

    setActiveMemberModal(m);
    setEmailSubject(defaultSubject);
    setEmailBody(defaultBody);
    setModalMode('VIEW');
  };

  // Dispatch Email to Executive (Requirement 6)
  const handleSendExecEmail = () => {
    if (!activeExecModal) return;
    const execData = execList.find((e) => e.executive === activeExecModal);
    const unfulfilledCount = execData ? execData.unfulfilled : 0;

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newRecord: EmailRecord = {
      id: `eh-${Date.now()}`,
      date: dateStr,
      sender: '인사혁신담당 <hr.ax@axage.corp>',
      subject: emailSubject,
      recipient: `${activeExecModal} <executive.${activeExecModal.replace('임원', '')}@axage.corp>`,
      targetCount: unfulfilledCount,
      preview: emailBody.slice(0, 100) + '...'
    };

    setExecEmailHistory((prev) => ({
      ...prev,
      [activeExecModal]: [newRecord, ...(prev[activeExecModal] || [])]
    }));

    setActiveExecModal(null);
    showToast('이메일이 발송되었습니다.');
  };

  // Dispatch Email to Member (Requirement 8)
  const handleSendMemberEmail = () => {
    if (!activeMemberModal) return;

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newRecord: EmailRecord = {
      id: `mh-${Date.now()}`,
      date: dateStr,
      sender: '인사혁신담당 <hr.ax@axage.corp>',
      subject: emailSubject,
      recipient: `${activeMemberModal.name} ${activeMemberModal.rank} <${activeMemberModal.name}@axage.corp>`,
      preview: emailBody.slice(0, 100) + '...'
    };

    setMemberEmailHistory((prev) => ({
      ...prev,
      [activeMemberModal.id]: [newRecord, ...(prev[activeMemberModal.id] || [])]
    }));

    setActiveMemberModal(null);
    showToast('이메일이 발송되었습니다.');
  };

  // Bulk Executive Email Send (Requirement 7)
  const handleBulkExecSend = () => {
    const count = selectedExecs.size;
    setActiveBulkExecModal(false);
    setSelectedExecs(new Set());
    showToast(`이메일이 발송되었습니다. (총 ${count}명의 임원)`);
  };

  // Bulk Member Email Send (Requirement 9)
  const handleBulkMemberSend = () => {
    const count = selectedMembers.size;
    setActiveBulkMemberModal(false);
    setSelectedMembers(new Set());
    showToast(`이메일이 발송되었습니다. (총 ${count}명의 인원)`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* ==========================================
          HEADER SECTION (REQUIREMENT 1)
      ========================================== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-[1720px] mx-auto px-6 py-4 flex items-center justify-between gap-8">
          {/* Brand & System Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm">
              <Award className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">AXAGE 배지 매니징 시스템</h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  HR AX 포털
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                전사 임원 지휘 및 개인별 필수 배지 취득 현황 통합 모니터링 체계
              </p>
            </div>
          </div>

          {/* Right Top Action Bar (Requirement 1) */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>동기화 기준:</span>
              <span className="font-mono text-slate-700 font-medium">{lastSyncTime}</span>
            </div>

            {/* 배지정보 새로고침 버튼 */}
            <button
              onClick={handleRefreshBadges}
              disabled={isRefreshing}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white transition-all shadow-sm ${
                isRefreshing
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>배지정보 새로고침</span>
            </button>
          </div>
        </div>
      </header>

      {/* ==========================================
          MAIN CONTAINER
      ========================================== */}
      <main className="max-w-[1720px] mx-auto px-6 py-6 space-y-6">
        {/* KPI SUMMARY CARDS (REQUIREMENT 4) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>전사 배지 충족율</span>
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {stats.fulfilledRate.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-500 font-mono">
                ({stats.fulfilled.toLocaleString()} / {stats.total.toLocaleString()}명)
              </span>
            </div>
            <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${stats.fulfilledRate}%` }}
              />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>미충족 인원 (집중 관리)</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-rose-600 tabular-nums">
                {stats.unfulfilled.toLocaleString()}명
              </span>
              <span className="text-xs text-rose-600 font-semibold font-mono">
                ({((stats.unfulfilled / stats.total) * 100).toFixed(1)}%)
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">임원 지휘 및 1:1 독려 대상</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>G1 직급 충족율</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono">5개 필수</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {stats.rankStats.G1.total > 0
                  ? ((stats.rankStats.G1.fulfilled / stats.rankStats.G1.total) * 100).toFixed(1)
                  : 0}
                %
              </span>
              <span className="text-xs text-slate-500 font-mono">
                ({stats.rankStats.G1.fulfilled} / {stats.rankStats.G1.total}명)
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">DS_G, CL_G, DA_G, PE_G, DV_G</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>G2 직급 충족율</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono">4개 필수</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {stats.rankStats.G2.total > 0
                  ? ((stats.rankStats.G2.fulfilled / stats.rankStats.G2.total) * 100).toFixed(1)
                  : 0}
                %
              </span>
              <span className="text-xs text-slate-500 font-mono">
                ({stats.rankStats.G2.fulfilled} / {stats.rankStats.G2.total}명)
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">DA_B, PP_G, ML_G, AU_B</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>G3 직급 충족율</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-mono">3개 필수</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {stats.rankStats.G3.total > 0
                  ? ((stats.rankStats.G3.fulfilled / stats.rankStats.G3.total) * 100).toFixed(1)
                  : 0}
                %
              </span>
              <span className="text-xs text-slate-500 font-mono">
                ({stats.rankStats.G3.fulfilled} / {stats.rankStats.G3.total}명)
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">ML_B, AU_B, PP_B</p>
          </div>
        </section>

        {/* ==========================================
            UPPER CHARTS SECTION (REQUIREMENT 2 & 3)
        ========================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT CHART: 직급별 배지 기준 충족율 추이 (Requirement 2 & 4) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-base font-bold text-slate-900">
                    직급별 배지 기준 충족율 월단위 추이
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  직급별 인원수(분모) 대비 요구 배지 취득 성공 인원수(분자) 모니터링
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-blue-500 rounded" />
                  <span className="text-slate-600">G1</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-emerald-500 rounded" />
                  <span className="text-slate-600">G2</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-purple-500 rounded" />
                  <span className="text-slate-600">G3</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-slate-900 rounded" />
                  <span className="text-slate-900 font-semibold">전사</span>
                </span>
              </div>
            </div>

            {/* SVG Multi-line Chart */}
            <div className="h-64 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 540 200">
                {/* Horizontal Grid lines (0 to 3.5%) */}
                {[0, 1.0, 2.0, 3.0].map((val, idx) => {
                  const y = 170 - (val / 3.5) * 140;
                  return (
                    <g key={idx}>
                      <line x1="40" y1={y} x2="520" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                      <text x="32" y={y + 4} textAnchor="end" className="text-[10px] fill-slate-400 font-mono">
                        {val.toFixed(1)}%
                      </text>
                    </g>
                  );
                })}

                {/* X Axis Month Labels */}
                {MONTHLY_TREND_DATA.map((d, idx) => {
                  const x = 45 + idx * (470 / (MONTHLY_TREND_DATA.length - 1));
                  return (
                    <text
                      key={idx}
                      x={x}
                      y="190"
                      textAnchor="middle"
                      className="text-[10px] fill-slate-400 font-mono"
                    >
                      {d.month.split('.')[1]}월
                    </text>
                  );
                })}

                {/* Line G1 (Blue) */}
                <path
                  d={MONTHLY_TREND_DATA.map((d, idx) => {
                    const x = 45 + idx * (470 / (MONTHLY_TREND_DATA.length - 1));
                    const y = 170 - (d.G1 / 3.5) * 140;
                    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* Line G2 (Emerald) */}
                <path
                  d={MONTHLY_TREND_DATA.map((d, idx) => {
                    const x = 45 + idx * (470 / (MONTHLY_TREND_DATA.length - 1));
                    const y = 170 - (d.G2 / 3.5) * 140;
                    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* Line G3 (Purple) */}
                <path
                  d={MONTHLY_TREND_DATA.map((d, idx) => {
                    const x = 45 + idx * (470 / (MONTHLY_TREND_DATA.length - 1));
                    const y = 170 - (d.G3 / 3.5) * 140;
                    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* Line Total (Slate-900) */}
                <path
                  d={MONTHLY_TREND_DATA.map((d, idx) => {
                    const x = 45 + idx * (470 / (MONTHLY_TREND_DATA.length - 1));
                    const y = 170 - (d.total / 3.5) * 140;
                    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* End Point Markers for 2026.10 */}
                {(() => {
                  const last = MONTHLY_TREND_DATA[MONTHLY_TREND_DATA.length - 1];
                  const x = 515;
                  return (
                    <>
                      <circle cx={x} cy={170 - (last.G1 / 3.5) * 140} r="3.5" fill="#3b82f6" />
                      <circle cx={x} cy={170 - (last.G2 / 3.5) * 140} r="3.5" fill="#10b981" />
                      <circle cx={x} cy={170 - (last.G3 / 3.5) * 140} r="3.5" fill="#a855f7" />
                      <circle cx={x} cy={170 - (last.total / 3.5) * 140} r="4.5" fill="#0f172a" />
                    </>
                  );
                })()}
              </svg>
            </div>

            {/* Current Month Values Box */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-600">
              <span className="text-slate-400">현재(2026.10):</span>
              <span>G1: <strong className="text-blue-600">{((stats.rankStats.G1.fulfilled / stats.rankStats.G1.total) * 100).toFixed(1)}%</strong> ({stats.rankStats.G1.fulfilled}/{stats.rankStats.G1.total}명)</span>
              <span>G2: <strong className="text-emerald-600">{((stats.rankStats.G2.fulfilled / stats.rankStats.G2.total) * 100).toFixed(1)}%</strong> ({stats.rankStats.G2.fulfilled}/{stats.rankStats.G2.total}명)</span>
              <span>G3: <strong className="text-purple-600">{((stats.rankStats.G3.fulfilled / stats.rankStats.G3.total) * 100).toFixed(1)}%</strong> ({stats.rankStats.G3.fulfilled}/{stats.rankStats.G3.total}명)</span>
              <span>전사: <strong className="text-slate-900 font-bold">{stats.fulfilledRate.toFixed(1)}%</strong> ({stats.fulfilled}/{stats.total}명)</span>
            </div>
          </div>

          {/* RIGHT CHART: 배지별 취득율 그래프 (Requirement 3 - 낮은 순 정렬) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-base font-bold text-slate-900">
                      배지별 취득율 현황 (취득율 최저 순위)
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    취득 대상 인원수(분모) 대비 실제 배지 취득 성공 인원수(분자) · 오름차순 정렬
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-medium">
                  취득 취약 배지 우선
                </span>
              </div>

              {/* Horizontal Bars */}
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {badgeRates.map((item) => {
                  const rate = item.denominator > 0 ? (item.numerator / item.denominator) * 100 : 0;
                  const { cat, level } = parseBadge(item.badge);
                  const info = BADGE_DICT[cat];
                  const levelLabel = LEVEL_NAMES[level] || level;

                  // Color gradient depending on rate severity
                  let barColor = 'bg-rose-500';
                  if (rate > 15) barColor = 'bg-amber-500';
                  if (rate > 28) barColor = 'bg-indigo-500';

                  return (
                    <div key={item.badge} className="flex items-center gap-3 text-xs group">
                      <div className="w-20 shrink-0 flex items-center gap-1 font-mono">
                        <span className="font-bold text-slate-800">{item.badge}</span>
                        <span className="text-[10px] text-slate-400">({item.reqRanks.join('/')})</span>
                      </div>
                      <div className="w-28 shrink-0 truncate text-slate-500 text-[11px]" title={`${info?.fullName || cat} (${levelLabel})`}>
                        {info?.fullName || cat}
                      </div>
                      <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden relative">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${Math.max(rate * 2.8, 3)}%` }}
                        />
                      </div>
                      <div className="w-28 text-right shrink-0 font-mono">
                        <span className="font-bold text-slate-900">{rate.toFixed(1)}%</span>
                        <span className="text-[11px] text-slate-400 ml-1">
                          ({item.numerator}/{item.denominator})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> 15% 미만 (최우선 집중 교육)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> 15% ~ 27%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" /> 28% 이상
              </span>
            </div>
          </div>
        </section>

        {/* ==========================================
            MAIN SPLIT MONITORING SECTION
            (LEFT: EXECUTIVE MONITORING | RIGHT: PERSONAL MONITORING)
        ========================================== */}
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* ==========================================
              MAIN LEFT: 임원별 모니터링 & 지휘 이메일
              (REQUIREMENTS 5, 6, 7)
          ========================================== */}
          <div className="xl:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[750px]">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    임원별 배지 미충족율 순위 (지휘 관리)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  미충족 인원 비중이 가장 높은 임원부터 순차 정렬
                </p>
              </div>

              {/* Bulk Email Trigger (Requirement 7) */}
              {selectedExecs.size > 0 && (
                <button
                  onClick={() => setActiveBulkExecModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>일괄 지휘 메일 ({selectedExecs.size}명)</span>
                </button>
              )}
            </div>

            {/* Table Control Bar */}
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={isAllExecsSelected}
                  onChange={toggleSelectAllExecs}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>전체선택 ({execList.length}명)</span>
              </label>
              <span className="text-[11px] text-slate-400">
                선택됨: {selectedExecs.size}명
              </span>
            </div>

            {/* Executives List Table (Requirement 5 & 6) */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {execList.map((item, index) => {
                const unfRate = (item.unfulfilled / item.total) * 100;
                const isSelected = selectedExecs.has(item.executive);
                const historyCount = execEmailHistory[item.executive]?.length || 0;

                return (
                  <div
                    key={item.executive}
                    className={`p-3.5 hover:bg-slate-50 transition-colors flex items-center gap-3 ${
                      isSelected ? 'bg-indigo-50/40' : ''
                    }`}
                  >
                    {/* Checkbox (Requirement 7) */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectExec(item.executive)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />

                    {/* Rank Number */}
                    <span className="w-5 text-center text-xs font-mono font-bold text-slate-400">
                      {index + 1}
                    </span>

                    {/* Executive Info & Click to open email modal (Requirement 6) */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openExecModal(item.executive)}
                          className="font-bold text-sm text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 text-left"
                          title="클릭하여 지휘 요청 이메일 발송 창 열기"
                        >
                          <span>{item.executive}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
                        </button>
                        <span className="text-xs text-slate-500 truncate">
                          {item.org}
                        </span>
                        {historyCount > 0 && (
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            발송 {historyCount}회
                          </span>
                        )}
                      </div>

                      {/* Progress Bar of Unfulfilled */}
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-rose-500 h-2 rounded-full"
                            style={{ width: `${unfRate}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-bold text-rose-600">
                          {unfRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Stats & Direct Action Button */}
                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      <span className="text-xs font-mono text-slate-600">
                        <strong className="text-rose-600 font-bold">{item.unfulfilled}명</strong> / {item.total}명 미충족
                      </span>
                      <button
                        onClick={() => openExecModal(item.executive)}
                        className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors flex items-center gap-1"
                      >
                        <Mail className="w-3 h-3 text-slate-500" />
                        <span>지휘 메일</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ==========================================
              MAIN RIGHT: 개인별 배지 현황 및 권고 이메일
              (REQUIREMENTS 8, 9)
          ========================================== */}
          <div className="xl:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[750px]">
            {/* Header with Search & Filter */}
            <div className="p-4 border-b border-slate-200 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-900 text-sm">
                      개인별 배지 취득 현황 (미충족자 순차 정렬)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    이름 클릭 시 요구 배지 대비 부족 배지 확인 및 권고 이메일 발송
                  </p>
                </div>

                {/* Bulk Member Email Trigger (Requirement 9) */}
                {selectedMembers.size > 0 && (
                  <button
                    onClick={() => setActiveBulkMemberModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm shrink-0"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>일괄 독려 메일 ({selectedMembers.size}명)</span>
                  </button>
                )}
              </div>

              {/* Filters & Search Row */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 text-xs">
                {/* Search */}
                <div className="relative sm:col-span-2">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => {
                      setMemberSearch(e.target.value);
                      setMemberPage(1);
                    }}
                    placeholder="성명, 팀명, 임원명, 조직 검색..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Rank Filter */}
                <select
                  value={filterRank}
                  onChange={(e) => {
                    setFilterRank(e.target.value as any);
                    setMemberPage(1);
                  }}
                  className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="ALL">직급 전체 (G1/G2/G3)</option>
                  <option value="G1">G1 직급만</option>
                  <option value="G2">G2 직급만</option>
                  <option value="G3">G3 직급만</option>
                </select>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value as any);
                    setMemberPage(1);
                  }}
                  className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="ALL">상태 전체</option>
                  <option value="UNFULFILLED">미충족자만 (권고 대상)</option>
                  <option value="FULFILLED">충족자만</option>
                </select>
              </div>
            </div>

            {/* Table Control Bar */}
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={isAllMembersSelected}
                  onChange={toggleSelectAllMembers}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>현재 필터 전체선택 ({filteredMembers.length}명)</span>
              </label>
              <span className="text-[11px] text-slate-400">
                선택됨: {selectedMembers.size}명 · 전체 {members.length}명 중
              </span>
            </div>

            {/* Members Table */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {paginatedMembers.map((m) => {
                const isSelected = selectedMembers.has(m.id);
                const historyCount = memberEmailHistory[m.id]?.length || 0;

                return (
                  <div
                    key={m.id}
                    className={`p-3 hover:bg-slate-50 transition-colors flex items-center gap-3 text-xs ${
                      isSelected ? 'bg-indigo-50/40' : ''
                    }`}
                  >
                    {/* Checkbox (Requirement 9) */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectMember(m.id)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />

                    {/* Member Name (Clickable - Requirement 8) */}
                    <div className="w-24 shrink-0">
                      <button
                        onClick={() => openMemberModal(m)}
                        className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 text-left"
                        title="클릭하여 배지 권고 이메일 발송 창 열기"
                      >
                        <span>{m.name}</span>
                        <ChevronRight className="w-3 h-3 text-indigo-400" />
                      </button>
                      <span className="text-[10px] font-mono text-slate-500 px-1 py-0.2 rounded bg-slate-100">
                        {m.rank}
                      </span>
                    </div>

                    {/* Org / Team / Exec */}
                    <div className="w-44 shrink-0 truncate text-slate-600">
                      <div className="truncate font-medium">{m.team} · {m.executive}</div>
                      <div className="text-[11px] text-slate-400 truncate">{m.org}</div>
                    </div>

                    {/* Badge Fulfillment Status & Deficient Badges */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {m.isFulfilled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            충족 완료
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3" />
                            미충족 ({m.missingBadges.length}개 부족)
                          </span>
                        )}

                        {/* Deficient Badges Pills */}
                        {m.missingBadges.map((b) => (
                          <span
                            key={b}
                            className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-mono"
                          >
                            +{b}
                          </span>
                        ))}
                      </div>

                      {/* Current badges held */}
                      <div className="mt-1 text-[11px] text-slate-400 truncate">
                        보유: {m.badges.length ? m.badges.join(', ') : '취득 배지 없음'}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="shrink-0 flex items-center gap-2">
                      {historyCount > 0 && (
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          발송 {historyCount}회
                        </span>
                      )}
                      <button
                        onClick={() => openMemberModal(m)}
                        className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors flex items-center gap-1"
                      >
                        <Mail className="w-3 h-3 text-slate-500" />
                        <span>권고 메일</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredMembers.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  조건에 일치하는 구성원이 없습니다.
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
              <span>
                {(memberPage - 1) * rowsPerPage + 1} -{' '}
                {Math.min(memberPage * rowsPerPage, filteredMembers.length)} / 총{' '}
                {filteredMembers.length}명
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={memberPage <= 1}
                  onClick={() => setMemberPage((p) => Math.max(p - 1, 1))}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-50"
                >
                  이전
                </button>
                <span className="font-mono text-slate-700">
                  {memberPage} / {totalMemberPages}
                </span>
                <button
                  disabled={memberPage >= totalMemberPages}
                  onClick={() => setMemberPage((p) => Math.min(p + 1, totalMemberPages))}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-50"
                >
                  다음
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ==========================================
          MODAL 1: 임원 지휘 이메일 팝업 (REQUIREMENT 6)
      ========================================== */}
      {activeExecModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {activeExecModal} 지휘 요청 이메일 발송
                  </h3>
                  <p className="text-xs text-slate-500">
                    소속 조직 배지 취득 미충족 인원에 대한 조직원 독려 및 지휘 요청
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveExecModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {modalMode === 'HISTORY' ? (
                /* 과거 발송 정보 보기 뷰 */
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <History className="w-4 h-4 text-indigo-600" />
                      <span>지난 1년간 {activeExecModal} 발송 이력 ({execEmailHistory[activeExecModal]?.length || 0}건)</span>
                    </div>
                    <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      * 너무 자주 같은 내용을 발송하지 않도록 주의해 주세요.
                    </span>
                  </div>

                  {execEmailHistory[activeExecModal]?.length ? (
                    <div className="space-y-3">
                      {execEmailHistory[activeExecModal].map((rec) => (
                        <div key={rec.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1.5">
                          <div className="flex items-center justify-between text-slate-500 text-[11px]">
                            <span className="font-mono font-medium text-slate-700">{rec.date}</span>
                            <span>수신: {rec.recipient}</span>
                          </div>
                          <div className="font-bold text-slate-900">{rec.subject}</div>
                          <p className="text-slate-600 text-[11px] leading-relaxed">{rec.preview}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      지난 1년간 발송된 이메일 기록이 없습니다.
                    </div>
                  )}

                  <button
                    onClick={() => setModalMode('VIEW')}
                    className="w-full py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    이메일 작성 화면으로 돌아가기
                  </button>
                </div>
              ) : (
                /* 이메일 내용 보기 / 수정하기 뷰 */
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      받는 사람 (임원)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={`${activeExecModal} <executive.${activeExecModal.replace('임원', '')}@axage.corp>`}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono text-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      메일 제목
                    </label>
                    {modalMode === 'EDIT' ? (
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900">
                        {emailSubject}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        메일 본문 (미충족 인원 및 요구 배지 리스트 포함)
                      </label>
                      {modalMode === 'EDIT' && (
                        <span className="text-[11px] text-indigo-600 font-medium">
                          * 내용 수정 중
                        </span>
                      )}
                    </div>
                    {modalMode === 'EDIT' ? (
                      <textarea
                        rows={12}
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        className="w-full p-3 bg-white border border-indigo-300 rounded-lg text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    ) : (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono leading-relaxed whitespace-pre-wrap text-slate-800 max-h-[300px] overflow-y-auto">
                        {emailBody}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer with 3 Required Buttons (Requirement 6) */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              {/* Button 1: 과거 발송 정보 보기 */}
              <button
                type="button"
                onClick={() => setModalMode(modalMode === 'HISTORY' ? 'VIEW' : 'HISTORY')}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors shadow-sm"
              >
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>과거 발송 정보 보기</span>
              </button>

              <div className="flex items-center gap-2">
                {/* Button 2: 수정하기 */}
                <button
                  type="button"
                  onClick={() => setModalMode(modalMode === 'EDIT' ? 'VIEW' : 'EDIT')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors shadow-sm ${
                    modalMode === 'EDIT'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{modalMode === 'EDIT' ? '수정 완료' : '수정하기'}</span>
                </button>

                {/* Button 3: 그대로 발송하기 */}
                <button
                  type="button"
                  onClick={handleSendExecEmail}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>그대로 발송하기</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 2: 개인별 배지 권고 이메일 팝업 (REQUIREMENT 8)
      ========================================== */}
      {activeMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {activeMemberModal.name} ({activeMemberModal.rank}) 배지 권고 이메일
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activeMemberModal.org} · {activeMemberModal.team} · 관리임원: {activeMemberModal.executive}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveMemberModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {/* Badge Comparison Cards */}
              <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">직급 필수 기준:</span>
                  <div className="flex flex-wrap gap-1">
                    {REQ_MAP[activeMemberModal.rank].map((b) => (
                      <span key={b} className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[10px]">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">현재 보유 배지:</span>
                  <div className="flex flex-wrap gap-1">
                    {activeMemberModal.badges.length ? (
                      activeMemberModal.badges.map((b) => (
                        <span key={b} className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-mono text-[10px]">
                          {b}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 text-[11px]">없음</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-rose-600 font-semibold block mb-1">추가 취득 요구 배지:</span>
                  <div className="flex flex-wrap gap-1">
                    {activeMemberModal.missingBadges.length ? (
                      activeMemberModal.missingBadges.map((b) => (
                        <span key={b} className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-mono font-bold text-[10px]">
                          {b}
                        </span>
                      ))
                    ) : (
                      <span className="text-emerald-600 font-medium text-[11px]">전부 충족</span>
                    )}
                  </div>
                </div>
              </div>

              {modalMode === 'HISTORY' ? (
                /* 과거 발송 정보 보기 뷰 */
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <History className="w-4 h-4 text-indigo-600" />
                      <span>지난 1년간 {activeMemberModal.name}님 발송 이력 ({memberEmailHistory[activeMemberModal.id]?.length || 0}건)</span>
                    </div>
                    <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      * 너무 자주 같은 내용을 발송하지 않도록 주의해 주세요.
                    </span>
                  </div>

                  {memberEmailHistory[activeMemberModal.id]?.length ? (
                    <div className="space-y-3">
                      {memberEmailHistory[activeMemberModal.id].map((rec) => (
                        <div key={rec.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1.5">
                          <div className="flex items-center justify-between text-slate-500 text-[11px]">
                            <span className="font-mono font-medium text-slate-700">{rec.date}</span>
                            <span>수신: {rec.recipient}</span>
                          </div>
                          <div className="font-bold text-slate-900">{rec.subject}</div>
                          <p className="text-slate-600 text-[11px] leading-relaxed">{rec.preview}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      지난 1년간 발송된 권고 이메일 기록이 없습니다.
                    </div>
                  )}

                  <button
                    onClick={() => setModalMode('VIEW')}
                    className="w-full py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    이메일 작성 화면으로 돌아가기
                  </button>
                </div>
              ) : (
                /* 이메일 내용 보기 / 수정하기 뷰 */
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      받는 사람 (개인)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={`${activeMemberModal.name} ${activeMemberModal.rank} <${activeMemberModal.name}@axage.corp>`}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono text-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      메일 제목
                    </label>
                    {modalMode === 'EDIT' ? (
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900">
                        {emailSubject}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        메일 본문
                      </label>
                      {modalMode === 'EDIT' && (
                        <span className="text-[11px] text-indigo-600 font-medium">
                          * 내용 수정 중
                        </span>
                      )}
                    </div>
                    {modalMode === 'EDIT' ? (
                      <textarea
                        rows={10}
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        className="w-full p-3 bg-white border border-indigo-300 rounded-lg text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    ) : (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono leading-relaxed whitespace-pre-wrap text-slate-800 max-h-[250px] overflow-y-auto">
                        {emailBody}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer with 3 Required Buttons (Requirement 8) */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              {/* Button 1: 과거 발송 정보 보기 */}
              <button
                type="button"
                onClick={() => setModalMode(modalMode === 'HISTORY' ? 'VIEW' : 'HISTORY')}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors shadow-sm"
              >
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>과거 발송 정보 보기</span>
              </button>

              <div className="flex items-center gap-2">
                {/* Button 2: 수정하기 */}
                <button
                  type="button"
                  onClick={() => setModalMode(modalMode === 'EDIT' ? 'VIEW' : 'EDIT')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors shadow-sm ${
                    modalMode === 'EDIT'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{modalMode === 'EDIT' ? '수정 완료' : '수정하기'}</span>
                </button>

                {/* Button 3: 그대로 발송하기 */}
                <button
                  type="button"
                  onClick={handleSendMemberEmail}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>그대로 발송하기</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 3: 임원 일괄 발송 모달 (REQUIREMENT 7)
      ========================================== */}
      {activeBulkExecModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  임원 일괄 지휘 메일 발송 ({selectedExecs.size}명)
                </h3>
              </div>
              <button
                onClick={() => setActiveBulkExecModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              선택하신 <strong className="text-rose-600 font-bold">{selectedExecs.size}명의 임원</strong>에게 각 임원이 총괄 관리하는 조직의 배지 미충족 구성원 명단 및 부족 배지 정보를 포함한 개별 지휘 요청 이메일을 일괄 발송합니다.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <span className="font-semibold text-slate-700 block mb-1">발송 대상 임원 목록:</span>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                {Array.from(selectedExecs).map((ex) => (
                  <span key={ex} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-800 text-xs">
                    {ex}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveBulkExecModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                취소
              </button>
              <button
                onClick={handleBulkExecSend}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>일괄 발송하기</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 4: 개인 일괄 발송 모달 (REQUIREMENT 9)
      ========================================== */}
      {activeBulkMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  개인 일괄 배지 권고 메일 발송 ({selectedMembers.size}명)
                </h3>
              </div>
              <button
                onClick={() => setActiveBulkMemberModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              선택하신 <strong className="text-indigo-600 font-bold">{selectedMembers.size}명의 구성원</strong>에게 각 개인의 직급 필수 배지 대비 현재 부족한 배지 내역과 교육/응시 권고 이메일을 개별 일괄 발송합니다.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <span className="font-semibold text-slate-700 block mb-1">발송 대상 샘플 (총 {selectedMembers.size}명):</span>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                {Array.from(selectedMembers)
                  .slice(0, 15)
                  .map((id) => {
                    const m = members.find((x) => x.id === id);
                    return (
                      <span key={id} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-800 text-xs">
                        {m?.name} ({m?.rank})
                      </span>
                    );
                  })}
                {selectedMembers.size > 15 && (
                  <span className="text-slate-400 text-xs self-center">... 외 {selectedMembers.size - 15}명</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveBulkMemberModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                취소
              </button>
              <button
                onClick={handleBulkMemberSend}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>일괄 발송하기</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TOAST ALERT (NOTIFICATION MESSAGE)
      ========================================== */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-800 text-xs font-medium animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
