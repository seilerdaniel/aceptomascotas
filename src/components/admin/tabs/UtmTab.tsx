import { TabsContent } from "@/components/ui/tabs";
import UtmLinkGenerator from "@/components/UtmLinkGenerator";

const UtmTab = () => {
  return (
    <TabsContent value="utm">
      <UtmLinkGenerator />
    </TabsContent>
  );
};

export default UtmTab;
