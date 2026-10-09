import type {SurvivorsGameState} from '../domain/patrol-survivors';
import {equipmentTuning} from '../engine/survivors-equipment-tuning';
export function drawEquipmentAura(ctx:CanvasRenderingContext2D,state:SurvivorsGameState,reduced:boolean) {
 const {player,activePerks}=state;
      if (activePerks.tesla_dome > 0) {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.scale(1, 0.58);
        const auraRadius = equipmentTuning('tesla_dome',1)!.radius;
        const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, auraRadius);
        grad.addColorStop(0, 'rgba(168, 237, 134, 0.20)');
        grad.addColorStop(0.6, 'rgba(98, 210, 153, 0.08)');
        grad.addColorStop(1, 'rgba(98, 210, 153, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(168,237,134,.55)';
        ctx.lineWidth = 1.3;
        for(let i=0;i<6;i++){
          const angle=i*Math.PI/3;
          ctx.beginPath();ctx.arc(0,0,auraRadius,angle+.12,angle+.62);ctx.stroke();
          const pulse=reduced?0:Math.sin(state.gameTime*3+i)*3;
          const r=auraRadius-8;
          ctx.beginPath();ctx.moveTo(Math.cos(angle)*(r-8),Math.sin(angle)*(r-8));
          ctx.lineTo(Math.cos(angle+.035)*(r+pulse),Math.sin(angle+.035)*(r+pulse));
          ctx.lineTo(Math.cos(angle)*(r+8),Math.sin(angle)*(r+8));ctx.stroke();
        }
        ctx.restore();
      } else if (activePerks.floodlight > 0) {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.scale(1, 0.58);
        const auraRadius = equipmentTuning('floodlight',activePerks.floodlight)!.radius;
        const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, auraRadius);
        grad.addColorStop(0, `rgba(251,191,36,${.16+activePerks.floodlight*.025})`);
        grad.addColorStop(0.6, 'rgba(245, 158, 11, 0.16)');
        grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

}
