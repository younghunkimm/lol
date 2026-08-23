import { INHOUSE_TEAM, INHOUSE_TEAM_MEMBER_KEYS } from "../../constants";
import { Badge } from "../shared/ui";

export function SessionModeBadge({ session, className = "" }) {
    if (session.isInhouse) {
        const teamACount =
            session[INHOUSE_TEAM_MEMBER_KEYS[INHOUSE_TEAM.A]].length;
        const teamBCount =
            session[INHOUSE_TEAM_MEMBER_KEYS[INHOUSE_TEAM.B]].length;

        return (
            <Badge
                className={`bg-orange-400/20 text-orange-200 ${className}`.trim()}
            >
                {teamACount}:{teamBCount} 내전
            </Badge>
        );
    }

    return (
        <Badge className={`bg-sky-400/15 text-sky-200 ${className}`.trim()}>
            개인전
        </Badge>
    );
}
